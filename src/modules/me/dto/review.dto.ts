import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export enum ConfirmationStatus {
  /** confirmation is set */
  READY = "ready",
  /** No question tests the same skill: skip to "explain more" */
  NONE = "none",
  /** The AI was unavailable; opening the review again tries again */
  PENDING = "pending",
}

export class ConfirmationQuestionDto {
  @ApiProperty({ example: 171, description: "Id of the confirmation question" })
  questionId: number;

  @ApiProperty({
    example: "multiple_choice",
    enum: ["multiple_choice", "short_answer"],
  })
  type: string;

  @ApiProperty({
    example: "(4a^2 - 2a + 3) - (a^2 - 6a + 7) ayirmani ixchamlang.",
  })
  prompt: string;

  @ApiProperty({
    type: [String],
    nullable: true,
    example: [
      "3a^2 + 4a - 4",
      "3a^2 - 8a + 10",
      "3a^2 + 4a + 10",
      "3a^2 - 8a - 4",
    ],
  })
  options: string[] | null;
}

export class MistakeDto {
  @ApiProperty({ example: 90 })
  questionId: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: "multiple_choice" })
  type: string;

  @ApiProperty({
    example: "(6a^2 - 3a + 4) - (2a^2 - 5a + 9) ayirmani ixchamlang.",
  })
  prompt: string;

  @ApiProperty({ type: [String], nullable: true })
  options: string[] | null;

  @ApiProperty({
    example: "4a^2 - 8a + 13",
    nullable: true,
    description: "null when unanswered",
  })
  yourAnswer: string | null;

  @ApiProperty({ example: "4a^2 + 2a - 5" })
  correctAnswer: string;

  @ApiProperty({
    example:
      "Minus ishorasini faqat birinchi hadga qo'llagansiz, qolgan hadlarning ishorasi ham o'zgarishi kerak edi.",
    description: "The specific misconception behind this answer",
  })
  misconception: string;

  @ApiProperty({ example: "Qavs ochilganda: ...", nullable: true })
  explanation: string | null;

  @ApiProperty({
    example: 14,
    nullable: true,
    description: "Textbook page of the source text",
  })
  page: number | null;

  @ApiProperty({
    example: "11-2",
    nullable: true,
    description:
      "The textbook paragraph the question was written from (ids as in GET /me/topics/:id); page is that paragraph's page",
  })
  paragraphId: string | null;

  @ApiProperty({ example: false })
  fixed: boolean;

  @ApiProperty({
    enum: ConfirmationStatus,
    example: ConfirmationStatus.READY,
    description:
      "ready: answer `confirmation`; none: no question tests the same skill, skip to explain more; " +
      "pending: the AI was unavailable, open the review again later",
  })
  confirmationStatus: ConfirmationStatus;

  @ApiProperty({
    type: ConfirmationQuestionDto,
    nullable: true,
    description:
      "Same skill (new numbers, or an approved pool question testing that skill); answer it with " +
      "POST .../confirm/:questionId. null unless confirmationStatus is ready",
  })
  confirmation: ConfirmationQuestionDto | null;
}

export class ReviewDto {
  @ApiProperty({ example: 8, nullable: true })
  topicId: number | null;

  @ApiProperty({ example: "Ko'phadlarni qo'shish va ayirish", nullable: true })
  topicTitle: string | null;

  @ApiProperty({ example: 14 })
  attemptId: number;

  @ApiProperty({ example: 15 })
  quizId: number;

  @ApiProperty({ example: 60 })
  scorePercent: number;

  @ApiProperty({ example: 4 })
  totalMistakes: number;

  @ApiProperty({ example: 1 })
  fixedCount: number;

  @ApiProperty({ type: [MistakeDto] })
  mistakes: MistakeDto[];
}

export class ConfirmDto {
  @ApiProperty({
    example: "3a^2 + 4a - 4",
    description: "Answer to the confirmation question",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  answer: string;
}

export class ConfirmResultDto {
  @ApiProperty({
    example: 90,
    description: "The original question (the mistake)",
  })
  questionId: number;

  @ApiProperty({ example: true })
  correct: boolean;

  @ApiProperty({ example: true, description: "The mistake is marked as fixed" })
  fixed: boolean;

  @ApiProperty({
    example: "Qavs oldida minus bo'lgani uchun ...",
    nullable: true,
    description: "Shown when correct",
  })
  explanation: string | null;

  @ApiProperty({
    example: "Qavs oldidagi minus har bir hadga ta'sir qiladi.",
    nullable: true,
    description: "A hint when wrong; never the answer",
  })
  hint: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description: "AI feedback on a short answer",
  })
  feedback: string | null;
}
