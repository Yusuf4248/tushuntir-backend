import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { MASTERY_PASS_PERCENT, MasteryStatus } from "../me.types";

export class SubjectRefDto {
  @ApiProperty({ example: 8 })
  id: number;

  @ApiProperty({ example: "Algebra" })
  name: string;
}

export class ChapterRefDto {
  @ApiProperty({ example: 6 })
  id: number;

  @ApiProperty({ example: "Algebraik ifodalar", nullable: true })
  title: string | null;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: "Chapter number in the textbook",
  })
  position: number | null;
}

export class ParagraphDto {
  @ApiProperty({
    example: "10-2",
    description: "<chunkId>-<paragraph number in the chunk>",
  })
  id: string;

  @ApiProperty({
    example: 10,
    description: "Textbook chunk; chat sources refer to it by chunkId",
  })
  chunkId: number;

  @ApiProperty({ example: 13, nullable: true })
  page: number | null;

  @ApiProperty({ example: 2, description: "1, 2, 3, … across the topic" })
  position: number;

  @ApiProperty({
    example:
      "O'xshash hadlarni ixchamlash uchun ularning koeffitsiyentlari qo'shiladi, harfiy qism esa o'zgarmaydi.",
    description: "Markdown-like text: may start with a '### ' heading line",
  })
  content: string;
}

export class TopicDetailDto {
  @ApiProperty({ example: 8 })
  topicId: number;

  @ApiProperty({ example: "Ko'phadlarni qo'shish va ayirish" })
  title: string;

  @ApiProperty({ type: SubjectRefDto })
  subject: SubjectRefDto;

  @ApiProperty({ type: ChapterRefDto })
  chapter: ChapterRefDto;

  @ApiProperty({
    example: 3,
    nullable: true,
    description: "Topic position in the chapter",
  })
  position: number | null;

  @ApiProperty({ enum: MasteryStatus, example: MasteryStatus.IN_PROGRESS })
  status: MasteryStatus;

  @ApiProperty({
    example: true,
    description: "Information only (docs/mastery-rules.md)",
  })
  unlocked: boolean;

  @ApiProperty({
    nullable: true,
    description:
      "2-3 sentences in simple Uzbek; null until content:load writes it",
  })
  summary: string | null;

  @ApiProperty({ type: [String] })
  keyIdeas: string[];

  @ApiProperty({ type: [ParagraphDto] })
  paragraphs: ParagraphDto[];

  @ApiProperty({ example: 7, nullable: true })
  prevTopicId: number | null;

  @ApiProperty({ example: 9, nullable: true })
  nextTopicId: number | null;
}

export class AttemptsQueryDto {
  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 8, description: "Only this topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;
}

export enum AttemptKind {
  LESSON_QUIZ = "lesson_quiz",
  PRACTICE = "practice",
  CHECKPOINT = "checkpoint",
}

export class TopicRefDto {
  @ApiProperty({ example: 8 })
  id: number;

  @ApiProperty({ example: "Ko'phadlarni qo'shish va ayirish" })
  title: string;
}

export class AttemptHistoryItemDto {
  @ApiProperty({
    example: 35,
    description:
      "Attempt id for quizzes (use with /me/attempts/:id/review), checkpoint id for checkpoints",
  })
  id: number;

  @ApiProperty({ enum: AttemptKind, example: AttemptKind.LESSON_QUIZ })
  kind: AttemptKind;

  @ApiProperty({
    example: 15,
    nullable: true,
    description: "null for checkpoints",
  })
  quizId: number | null;

  @ApiProperty({ type: TopicRefDto, nullable: true })
  topic: TopicRefDto | null;

  @ApiProperty({ type: SubjectRefDto, nullable: true })
  subject: SubjectRefDto | null;

  @ApiProperty({ nullable: true })
  startedAt: Date | null;

  @ApiProperty({ nullable: true, description: "null while open" })
  finishedAt: Date | null;

  @ApiProperty({
    example: 60,
    nullable: true,
    description:
      "Quiz score, or for a checkpoint the share of key ideas covered",
  })
  scorePercent: number | null;

  @ApiProperty({
    enum: ["passed", "not_yet"],
    nullable: true,
    example: "not_yet",
    description: `Quizzes: passed at ${MASTERY_PASS_PERCENT}% or more; checkpoints: the judged result; null while open`,
  })
  result: "passed" | "not_yet" | null;

  @ApiProperty({
    example: 3,
    nullable: true,
    description:
      "Submitted quizzes: wrong answers not yet fixed by a confirmation question; checkpoints: 0; null while open",
  })
  openMistakes: number | null;
}

export class StudentSubjectDto {
  @ApiProperty({ example: 8 })
  id: number;

  @ApiProperty({ example: "Algebra" })
  name: string;

  @ApiProperty({
    example: 6,
    description: "Topics of the subject's textbook(s) at the class grade",
  })
  topicsTotal: number;

  @ApiProperty({ example: 1 })
  topicsMastered: number;
}
