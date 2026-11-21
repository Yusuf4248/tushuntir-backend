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
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../../common/auth/auth-user";
import { AppLanguage, Lang } from "../../common/i18n/language";
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
  LatestChatSessionQueryDto,
  WeakTopicDto,
} from "./dto/chat.dto";
import {
  CheckpointAnswerDto,
  CheckpointAnswerResultDto,
  CheckpointDto,
  CheckpointStatusDto,
} from "./dto/checkpoint.dto";
import { ConfirmDto, ConfirmResultDto, ReviewDto } from "./dto/review.dto";
import { StudentAttemptsService } from "./student-attempts.service";
import { AudioUploadInterceptor } from "./audio-upload.interceptor";
import {
  HOUR,
  MINUTE,
  RateLimit,
} from "../../common/throttle/rate-limit.decorator";
import { StudentChatService } from "./student-chat.service";
import { StudentCheckpointService } from "./student-checkpoint.service";
import { StudentPracticeService } from "./student-practice.service";
import { StudentReviewService } from "./student-review.service";
import { StudentScheduleService } from "./student-schedule.service";
import { StudentTopicsService } from "./student-topics.service";
import {
  AttemptHistoryItemDto,
  AttemptsQueryDto,
  StudentSubjectDto,
  TopicDetailDto,
} from "./dto/topic.dto";

@ApiTags("Student · Me")
@ApiHeader({
  name: "Accept-Language",
  required: false,
  description:
    "uz (default), ru or en: the language of AI replies (chat, hints, mistake review, Sardor and his " +
    "judging) and of translated quiz questions. Answers may be sent in the shown language; grading uses the " +
    "original Uzbek question.",
})
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
    private readonly practice: StudentPracticeService,
    private readonly checkpoints: StudentCheckpointService,
    private readonly topics: StudentTopicsService,
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
  start(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.attempts.start(id, user, language);
  }

  @Get("attempts")
  @ApiOperation({
    summary: "The student's quiz and checkpoint history, newest first",
    description:
      "Lesson quizzes, practice quizzes and Tushuntir checkpoint tries (exams are not listed). " +
      "For quizzes `id` is the attempt id (open the review with it); for checkpoints it is the checkpoint id.",
  })
  @ApiOkResponse({ type: [AttemptHistoryItemDto] })
  attemptHistory(
    @Query() query: AttemptsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topics.attempts(user, query);
  }

  @Get("attempts/:id")
  @ApiOperation({
    summary: "One of the student's attempts (to resume a quiz)",
    description:
      "The same view as quiz start: questions in order, saved answers and the hints already revealed. " +
      "Only the student's own attempts (404 otherwise).",
  })
  @ApiOkResponse({ type: AttemptViewDto })
  attempt(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.attempts.view(id, user, language);
  }

  @Post("attempts/:id/answers")
  @RateLimit(30, MINUTE)
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
    @Lang() language: AppLanguage,
  ) {
    return this.attempts.answer(id, dto.questionId, dto.answer, user, language);
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
    @Lang() language: AppLanguage,
  ) {
    return this.attempts.hint(id, questionId, user, language);
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
    @Lang() language: AppLanguage,
  ) {
    const result = await this.attempts.submit(id, user, language);
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
  review(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.reviews.review(id, user, language);
  }

  @Post("attempts/:id/confirm/:questionId")
  @RateLimit(30, MINUTE)
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
    @Lang() language: AppLanguage,
  ) {
    return this.reviews.confirm(id, questionId, dto.answer, user, language);
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

  @Get("chat/sessions")
  @ApiOperation({
    summary: "The student's latest chat session for a topic, with its messages",
    description:
      "Own study sessions only; 404 when the student has no session for the topic yet (then start one).",
  })
  @ApiOkResponse({ type: ChatSessionDto })
  latestChatSession(
    @Query() query: LatestChatSessionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.latestSession(query.topicId, user);
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
  @RateLimit(20, MINUTE)
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
    @Lang() language: AppLanguage,
  ) {
    return this.chat.send(id, dto, user, language);
  }

  @Get("weak-topics")
  @ApiOperation({
    summary: "Topics that need practice, with the sub-skills that went wrong",
    description:
      "Topics with status needs_practice (or needs_help); subSkills lists what went wrong in the student's " +
      "unfixed mistakes there, latest first.",
  })
  @ApiOkResponse({ type: [WeakTopicDto] })
  weakTopics(@CurrentUser() user: AuthUser, @Lang() language: AppLanguage) {
    return this.chat.weakTopics(user, language);
  }

  @Get("topics/:id")
  @ApiOperation({
    summary: "A textbook topic: summary, key ideas and paragraphs",
    description:
      "Only topics of the student's class subjects and grade (else 404). Paragraphs are the topic's textbook " +
      "text in order, each with its real page. status / unlocked follow docs/mastery-rules.md; " +
      "prevTopicId / nextTopicId follow book order within the textbook.",
  })
  @ApiOkResponse({ type: TopicDetailDto })
  topic(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.topics.topic(id, user);
  }

  @Post("topics/:id/practice")
  @RateLimit(10, HOUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Start a 5-question practice quiz on a topic",
    description:
      "Aimed at the student's past mistakes in the topic: unseen approved questions of the same type and difficulty " +
      "as the mistakes come first; new questions are generated (with the self-check) only when the pool runs out. " +
      "Then use the normal answers / hint / submit / review endpoints; submit updates mastery.",
  })
  @ApiOkResponse({ type: AttemptViewDto })
  startPractice(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.practice.start(id, user, language);
  }

  @Post("topics/:id/checkpoint/start")
  @RateLimit(10, MINUTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Start the Tushuntir checkpoint (or resume the open try)",
    description:
      "The AI classmate Sardor states a misconception of the topic (the student's own latest mistake there, " +
      "otherwise a common one) and asks to be taught. Returns the line as text and as audio (`audioUrl`, mp3). " +
      "409 when the topic has no key ideas yet.",
  })
  @ApiOkResponse({ type: CheckpointDto })
  startCheckpoint(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.checkpoints.start(id, user, language);
  }

  @Post("checkpoints/:id/answer")
  @RateLimit(10, MINUTE)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AudioUploadInterceptor)
  @ApiConsumes("multipart/form-data", "application/json")
  @ApiBody({
    description:
      "Either a recording (multipart field `audio`: webm, ogg, m4a, mp4, mp3 or wav; at most 5 MB and 90 seconds) " +
      "or JSON `{ text }` (at most 2000 characters).",
    schema: {
      type: "object",
      properties: {
        audio: { type: "string", format: "binary" },
        text: { type: "string", maxLength: 2000 },
      },
    },
  })
  @ApiOperation({
    summary: "Answer Sardor by voice or text",
    description:
      "Audio is transcribed (speech-to-text) and deleted; only the transcript is kept. The explanation is judged " +
      "against the topic's key ideas by meaning (Uzbek-Russian mixing is fine). Passing needs at least 80% of the " +
      "key ideas and no wrong statement. Missing ideas on the first answer → outcome `follow_up`: Sardor asks one " +
      "question, answer it with this endpoint. Then `passed` (topic mastered) or `not_yet` (a short explanation and " +
      "the next try in `next`; tries are unlimited). The 3rd not_yet since the last pass notifies the teacher.",
  })
  @ApiOkResponse({ type: CheckpointAnswerResultDto })
  answerCheckpoint(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CheckpointAnswerDto,
    @UploadedFile() audio: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.checkpoints.answer(
      id,
      {
        text: dto.text,
        audio: audio && {
          buffer: audio.buffer,
          mimeType: audio.mimetype,
          originalName: audio.originalname,
        },
      },
      user,
      language,
    );
  }

  @Get("topics/:id/checkpoint/status")
  @ApiOperation({
    summary: "Checkpoint status of a topic",
    description:
      "Judged tries, the last result, failed tries since the last pass, needs_help and the open try.",
  })
  @ApiOkResponse({ type: CheckpointStatusDto })
  checkpointStatus(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Lang() language: AppLanguage,
  ) {
    return this.checkpoints.status(id, user, language);
  }

  @Get("subjects")
  @ApiOperation({
    summary: "Subjects of the student's class with topic progress",
    description:
      "topicsTotal counts the topics of the subject's textbook(s) at the class grade (0 when there is no " +
      "textbook yet); topicsMastered counts those with status mastered.",
  })
  @ApiOkResponse({ type: [StudentSubjectDto] })
  subjects(@CurrentUser() user: AuthUser) {
    return this.topics.subjects(user);
  }

  @Get("mastery")
  @ApiOperation({
    summary: "Topic mastery and unlock state for the student's subjects",
    description:
      "Topics in book order. status: mastered (passed the Tushuntir checkpoint) > needs_help (3+ failed " +
      "checkpoint tries since the last pass; the teacher was notified) > not_started (no quiz yet) / " +
      "in_progress (latest quiz ≥ 80%) / needs_practice (latest quiz < 80%). unlocked: the first topic of its " +
      "textbook, a mastered topic, or the previous topic is mastered. unlocked is information only: lessons, the textbook, " +
      "quizzes, practice and the checkpoint stay open for every topic. Full rules: docs/mastery-rules.md.",
  })
  @ApiOkResponse({ type: MasteryListDto })
  mastery(@CurrentUser() user: AuthUser) {
    return this.schedule.mastery(user.id);
  }
}
