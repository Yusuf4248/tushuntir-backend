import {
  Body,
  Controller,
  Get,
  Logger,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../../common/auth/auth-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums";
import { ApiErrorResponses } from "../../common/swagger/api-responses.decorator";
import { AnswerDto } from "./dto/answer.dto";
import {
  AnswerResultDto,
  AttemptViewDto,
  HintDto,
  MasteryListDto,
  QuizListDto,
  SubmitResultDto,
  TodayDto,
} from "./dto/me-responses.dto";
import {
  ChatExchangeDto,
  ChatMessageDto,
  ChatSessionDto,
  CreateChatSessionDto,
  WeakTopicDto,
} from "./dto/chat.dto";
import { ConfirmDto, ConfirmResultDto, ReviewDto } from "./dto/review.dto";
import { StudentAttemptsService } from "./student-attempts.service";
import { StudentChatService } from "./student-chat.service";
import { StudentReviewService } from "./student-review.service";
import { StudentScheduleService } from "./student-schedule.service";

@ApiTags("Student · Me")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(UserRole.STUDENT)
@Controller("me")
export class MeController {
  private readonly logger = new Logger(MeController.name);

  constructor(
    private readonly schedule: StudentScheduleService,
    private readonly attempts: StudentAttemptsService,
    private readonly reviews: StudentReviewService,
    private readonly chat: StudentChatService,
  ) {}

  @Get("today")
  @ApiOperation({
    summary: "Today's timetable with lesson status and quizzes",
    description:
      "Lessons of the student's class for today (school time zone): subject, topic, teacher, time and status " +
      "(upcoming / in_progress / finished). Each lesson carries its quiz, which unlocks when the lesson ends. " +
      "`quizzes` lists every quiz the student can take now, with its deadline.",
  })
  @ApiOkResponse({ type: TodayDto })
  today(@CurrentUser() user: AuthUser) {
    return this.schedule.today(user.id);
  }

  @Get("quizzes")
  @ApiOperation({
    summary: "Lesson quizzes: available, done and overdue",
    description:
      "A quiz unlocks when its lesson ends and closes at its deadline (22:00 school time on the lesson day by default). " +
      "Locked quizzes are not listed.",
  })
  @ApiOkResponse({ type: QuizListDto })
  quizzes(@CurrentUser() user: AuthUser) {
    return this.schedule.quizzes(user.id);
  }

  @Post("quizzes/:id/start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Start a quiz (or resume the open attempt)",
    description:
      "Picks 10 random approved questions of the quiz topic (a different set and order per student). " +
      "One attempt per quiz: calling again returns the same open attempt; 409 once submitted, before the lesson ends or after the deadline.",
  })
  @ApiOkResponse({ type: AttemptViewDto })
  start(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.attempts.start(id, user);
  }

  @Post("attempts/:id/answers")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Save one answer",
    description:
      "One answer at a time; it can be changed until submit. Correctness is not revealed until submit. " +
      "Short answers are checked by normalized match first, then by the AI.",
  })
  @ApiOkResponse({ type: AnswerResultDto })
  answer(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attempts.answer(id, dto.questionId, dto.answer, user);
  }

  @Post("attempts/:id/questions/:qid/hint")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get the next hint level (1 → 2 → 3)",
    description:
      "Counts hints_used and never returns the answer. If the saved answer is a wrong option, " +
      "`misconception` explains the mistake that option shows.",
  })
  @ApiOkResponse({ type: HintDto })
  hint(
    @Param("id", ParseIntPipe) id: number,
    @Param("qid", ParseIntPipe) questionId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attempts.hint(id, questionId, user);
  }

  @Post("attempts/:id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Submit the attempt: score, per-question results and mastery update",
    description:
      "Unanswered questions count as wrong. Score = correct answers / questions. " +
      "Updates topic_mastery (home score); submitting again returns the same result.",
  })
  @ApiOkResponse({ type: SubmitResultDto })
  async submit(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.attempts.submit(id, user);
    if (result.correctCount < result.totalQuestions) {
      // Prepare the mistake review (explanations, confirmation questions) in the background.
      this.reviews
        .review(id, user)
        .catch((error: Error) =>
          this.logger.warn(
            `review prewarm for attempt ${id} failed: ${error.message}`,
          ),
        );
    }
    return result;
  }

  @Get("attempts/:id/review")
  @ApiOperation({
    summary: "Mistake review of a submitted attempt",
    description:
      "For each wrong or unanswered question: the student's answer, the correct answer, a short explanation of the " +
      "specific misconception, the textbook page, and one confirmation question (same skill, new numbers). " +
      "Explanations and confirmation questions are generated once and cached. 409 before submit.",
  })
  @ApiOkResponse({ type: ReviewDto })
  review(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.reviews.review(id, user);
  }

  @Post("attempts/:id/confirm/:questionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Answer a mistake's confirmation question",
    description:
      "`questionId` is the original question (the mistake). A correct answer marks the mistake as fixed; " +
      "a wrong one returns a hint and can be retried.",
  })
  @ApiOkResponse({ type: ConfirmResultDto })
  confirm(
    @Param("id", ParseIntPipe) id: number,
    @Param("questionId", ParseIntPipe) questionId: number,
    @Body() dto: ConfirmDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reviews.confirm(id, questionId, dto.answer, user);
  }

  @Post("chat/sessions")
  @ApiOperation({ summary: "Start a self-study chat about a topic" })
  @ApiCreatedResponse({ type: ChatSessionDto })
  createChatSession(
    @Body() dto: CreateChatSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.createSession(dto.topicId, user);
  }

  @Get("chat/sessions/:id")
  @ApiOperation({ summary: "A chat session with its messages" })
  @ApiOkResponse({ type: ChatSessionDto })
  chatSession(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.session(id, user);
  }

  @Post("chat/sessions/:id/messages")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Ask the study helper (grounded in the textbook)",
    description:
      "Answers only from the topic's textbook text (plus `selectedText`), in simple Uzbek, or Russian when asked " +
      "or with action `in_russian`. Returns the source pages; says so when the text does not cover the question. " +
      "Stays on school topics and refuses to solve the student's open quiz questions. " +
      "Quick actions: explain_simple, real_life_example, in_russian, quiz_me. Messages are saved in ai_messages.",
  })
  @ApiOkResponse({ type: ChatExchangeDto })
  sendChatMessage(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ChatMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.send(id, dto, user);
  }

  @Get("weak-topics")
  @ApiOperation({
    summary: "Topics that need practice, with the sub-skills that went wrong",
    description:
      "Topics with status needs_practice (or needs_help); subSkills lists what went wrong in the student's " +
      "unfixed mistakes there, latest first.",
  })
  @ApiOkResponse({ type: [WeakTopicDto] })
  weakTopics(@CurrentUser() user: AuthUser) {
    return this.chat.weakTopics(user);
  }

  @Get("mastery")
  @ApiOperation({
    summary: "Topic mastery for the student's subjects",
    description:
      "not_started: no quiz yet; in_progress: latest quiz score ≥ 80%; needs_practice: below 80%; " +
      "mastered: passed the voice checkpoint (part 2).",
  })
  @ApiOkResponse({ type: MasteryListDto })
  mastery(@CurrentUser() user: AuthUser) {
    return this.schedule.mastery(user.id);
  }
}
