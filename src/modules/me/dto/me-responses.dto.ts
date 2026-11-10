import { ApiProperty } from "@nestjs/swagger";
import {
  LessonStatus,
  MASTERY_RULE,
  MasteryStatus,
  StudentQuizStatus,
} from "../me.types";

export class RefDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: "Algebra" })
  name: string;
}

export class TopicRefDto {
  @ApiProperty({ example: 6 })
  id: number;

  @ApiProperty({ example: "Algebraik ifoda va uning qiymati" })
  title: string;
}

export class TeacherRefDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: "Dilnoza" })
  firstName: string;

  @ApiProperty({ example: "Karimova" })
  lastName: string;
}

export class AttemptSummaryDto {
  @ApiProperty({ example: 31 })
  id: number;

  @ApiProperty({ example: "2026-11-09T12:40:00.000Z" })
  startedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  scorePercent: number | null;
}

export class StudentQuizDto {
  @ApiProperty({ example: 13 })
  quizId: number;

  @ApiProperty({
    example: "Algebraik ifoda va uning qiymati: dars bo'yicha test",
    nullable: true,
  })
  title: string | null;

  @ApiProperty({ type: TopicRefDto, nullable: true })
  topic: TopicRefDto | null;

  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({ example: 8 })
  lessonId: number;

  @ApiProperty({ example: "2026-11-09" })
  lessonDate: string;

  @ApiProperty({
    example: "2026-11-09T04:40:00.000Z",
    description: "When the lesson ends and the quiz opens",
  })
  unlocksAt: Date;

  @ApiProperty({ example: "2026-11-09T17:00:00.000Z", nullable: true })
  dueAt: Date | null;

  @ApiProperty({
    enum: StudentQuizStatus,
    example: StudentQuizStatus.AVAILABLE,
  })
  status: StudentQuizStatus;

  @ApiProperty({ type: AttemptSummaryDto, nullable: true })
  attempt: AttemptSummaryDto | null;
}

export class TodayLessonDto {
  @ApiProperty({ example: 8 })
  lessonId: number;

  @ApiProperty({ example: 2, nullable: true })
  period: number | null;

  @ApiProperty({ example: "08:55", nullable: true })
  startsAt: string | null;

  @ApiProperty({ example: "09:40", nullable: true })
  endsAt: string | null;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.FINISHED })
  status: LessonStatus;

  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({ type: TopicRefDto, nullable: true })
  topic: TopicRefDto | null;

  @ApiProperty({ type: TeacherRefDto })
  teacher: TeacherRefDto;

  @ApiProperty({ example: "7-A xonasi", nullable: true })
  room: string | null;

  @ApiProperty({
    type: StudentQuizDto,
    nullable: true,
    description: "The quiz that opens when this lesson ends",
  })
  quiz: StudentQuizDto | null;
}

export class ClassRefDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: "7-A" })
  name: string;
}

export class TodayDto {
  @ApiProperty({ example: "2026-11-09", description: "School-local date" })
  date: string;

  @ApiProperty({ example: "Asia/Tashkent" })
  timezone: string;

  @ApiProperty({ type: ClassRefDto, nullable: true })
  class: ClassRefDto | null;

  @ApiProperty({ type: [TodayLessonDto] })
  lessons: TodayLessonDto[];

  @ApiProperty({
    type: [StudentQuizDto],
    description: "Quizzes the student can take now, soonest deadline first",
  })
  quizzes: StudentQuizDto[];
}

export class QuizListDto {
  @ApiProperty({ type: [StudentQuizDto] })
  available: StudentQuizDto[];

  @ApiProperty({ type: [StudentQuizDto] })
  done: StudentQuizDto[];

  @ApiProperty({ type: [StudentQuizDto] })
  overdue: StudentQuizDto[];
}

export class AttemptQuestionDto {
  @ApiProperty({ example: 42 })
  questionId: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({
    example: "multiple_choice",
    enum: ["multiple_choice", "short_answer"],
  })
  type: string;

  @ApiProperty({ example: "a = 4 bo'lganda 3a + 5 nechaga teng?" })
  prompt: string;

  @ApiProperty({
    example: ["35", "17", "20", "12"],
    nullable: true,
    type: [String],
    description: "Multiple choice only; order is fixed per student",
  })
  options: string[] | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description: "The saved answer",
  })
  answer: string | null;

  @ApiProperty({ example: 0 })
  hintsUsed: number;

  @ApiProperty({ example: 3 })
  hintsAvailable: number;
}

export class AttemptViewDto {
  @ApiProperty({ example: 31 })
  attemptId: number;

  @ApiProperty({ example: 13 })
  quizId: number;

  @ApiProperty({
    example: "Algebraik ifoda va uning qiymati: dars bo'yicha test",
    nullable: true,
  })
  title: string | null;

  @ApiProperty({ example: "2026-11-09T17:00:00.000Z", nullable: true })
  dueAt: Date | null;

  @ApiProperty({ example: "2026-11-09T12:40:00.000Z" })
  startedAt: Date;

  @ApiProperty({ type: [AttemptQuestionDto] })
  questions: AttemptQuestionDto[];
}

export class AnswerResultDto {
  @ApiProperty({ example: 42 })
  questionId: number;

  @ApiProperty({ example: "17" })
  answer: string;

  @ApiProperty({ example: 1 })
  answeredCount: number;

  @ApiProperty({ example: 10 })
  totalQuestions: number;
}

export class HintDto {
  @ApiProperty({ example: 42 })
  questionId: number;

  @ApiProperty({
    example: 1,
    description: "1 = nudge, 2 = clue, 3 = worked similar example",
  })
  level: number;

  @ApiProperty({ example: "Avval ko'paytirishni bajaring." })
  hint: string;

  @ApiProperty({
    example: "Amallar tartibini buzib, avval qo'shgansiz.",
    nullable: true,
    description:
      "When the saved answer is a wrong option: the misconception that option shows",
  })
  misconception: string | null;

  @ApiProperty({ example: 1 })
  hintsUsed: number;

  @ApiProperty({ example: 2 })
  hintsRemaining: number;
}

export class SubmittedQuestionDto {
  @ApiProperty({ example: 42 })
  questionId: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: "multiple_choice" })
  type: string;

  @ApiProperty({ example: "a = 4 bo'lganda 3a + 5 nechaga teng?" })
  prompt: string;

  @ApiProperty({
    nullable: true,
    type: [String],
    example: ["35", "17", "20", "12"],
  })
  options: string[] | null;

  @ApiProperty({ example: "17", nullable: true })
  yourAnswer: string | null;

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: "17" })
  correctAnswer: string;

  @ApiProperty({ example: "3 · 4 = 12, keyin 12 + 5 = 17.", nullable: true })
  explanation: string | null;

  @ApiProperty({ example: 1 })
  hintsUsed: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: "AI feedback on a short answer",
  })
  aiFeedback: string | null;
}

export class MasteryUpdateDto {
  @ApiProperty({ example: 6 })
  topicId: number;

  @ApiProperty({ enum: MasteryStatus, example: MasteryStatus.IN_PROGRESS })
  status: MasteryStatus;

  @ApiProperty({ example: 80 })
  homeScore: number;
}

export class SubmitResultDto {
  @ApiProperty({ example: 31 })
  attemptId: number;

  @ApiProperty({ example: 13 })
  quizId: number;

  @ApiProperty({ example: 80 })
  scorePercent: number;

  @ApiProperty({ example: 8 })
  correctCount: number;

  @ApiProperty({ example: 10 })
  totalQuestions: number;

  @ApiProperty({ example: 2 })
  hintsUsed: number;

  @ApiProperty({ example: "2026-11-09T12:55:00.000Z" })
  finishedAt: Date;

  @ApiProperty({ type: [SubmittedQuestionDto] })
  questions: SubmittedQuestionDto[];

  @ApiProperty({ type: MasteryUpdateDto, nullable: true })
  mastery: MasteryUpdateDto | null;
}

export class MasteryTopicDto {
  @ApiProperty({ example: 6 })
  topicId: number;

  @ApiProperty({ example: "Algebraik ifoda va uning qiymati" })
  title: string;

  @ApiProperty({ example: "Algebraik ifodalar", nullable: true })
  chapter: string | null;

  @ApiProperty({ example: "Algebra" })
  subject: string;

  @ApiProperty({
    enum: MasteryStatus,
    example: MasteryStatus.NOT_STARTED,
    description:
      "mastered > needs_help > not_started / in_progress / needs_practice (docs/mastery-rules.md)",
  })
  status: MasteryStatus;

  @ApiProperty({
    example: true,
    description:
      "First topic of its textbook, or the previous topic is mastered. Information only: lessons, the " +
      "textbook, quizzes, practice and the checkpoint stay open for locked topics too.",
  })
  unlocked: boolean;

  @ApiProperty({ example: 0, description: "Judged checkpoint tries" })
  checkpointTries: number;

  @ApiProperty({ example: null, nullable: true, description: "0-100" })
  mastery: number | null;

  @ApiProperty({ example: null, nullable: true })
  homeScore: number | null;

  @ApiProperty({ example: null, nullable: true })
  examScore: number | null;

  @ApiProperty({ example: null, nullable: true })
  updatedAt: Date | null;
}

export class MasteryListDto {
  @ApiProperty({ example: MASTERY_RULE })
  rule: string;

  @ApiProperty({ type: [MasteryTopicDto] })
  topics: MasteryTopicDto[];
}
