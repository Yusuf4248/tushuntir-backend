import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { CheckpointResult, MasteryStatus } from "../me.types";

export class CheckpointAnswerDto {
  @ApiPropertyOptional({
    example:
      "Sardor, birhadlarni qo'shganda faqat koeffitsiyentlar qo'shiladi, harfiy qism o'zgarmaydi.",
    description:
      "A typed explanation. Send either this or the `audio` file (multipart), not both.",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text?: string;
}

export class SardorLineDto {
  @ApiProperty({
    example:
      "Menimcha, uch a kvadrat bilan ikki a kvadratni qo'shsak, besh a to'rtinchi daraja bo'ladi. To'g'rimi? Menga tushuntirib ber.",
  })
  text: string;

  @ApiProperty({
    example: "/uploads/tts/3f1c0b9e5a7d4c21b8e6f0a9d2c4e7b1.mp3",
    nullable: true,
    description:
      "The line read aloud (mp3, cached per text); null when speech synthesis is unavailable",
  })
  audioUrl: string | null;
}

export enum CheckpointStage {
  /** Waiting for the student's explanation */
  OPENING = "opening",
  /** Waiting for the answer to Sardor's follow-up question */
  FOLLOW_UP = "follow_up",
}

export class CheckpointDto {
  @ApiProperty({ example: 4 })
  checkpointId: number;

  @ApiProperty({ example: 7 })
  topicId: number;

  @ApiProperty({ example: "Birhad va uning standart shakli" })
  topicTitle: string;

  @ApiProperty({ example: 1 })
  tryNumber: number;

  @ApiProperty({ example: "Sardor" })
  speaker: string;

  @ApiProperty({ enum: CheckpointStage, example: CheckpointStage.OPENING })
  stage: CheckpointStage;

  @ApiProperty({ type: SardorLineDto, description: "Sardor's opening line" })
  prompt: SardorLineDto;

  @ApiProperty({
    type: SardorLineDto,
    nullable: true,
    description: "Set while the try waits for the follow-up answer",
  })
  followUp: SardorLineDto | null;

  @ApiProperty()
  createdAt: Date;
}

export class NextTopicDto {
  @ApiProperty({ example: 8 })
  topicId: number;

  @ApiProperty({ example: "Ko'phadlarni qo'shish va ayirish" })
  title: string;

  @ApiProperty({ example: true })
  unlocked: boolean;
}

export enum CheckpointOutcome {
  FOLLOW_UP = "follow_up",
  PASSED = "passed",
  NOT_YET = "not_yet",
}

export class CheckpointAnswerResultDto {
  @ApiProperty({ example: 4 })
  checkpointId: number;

  @ApiProperty({ example: 1 })
  tryNumber: number;

  @ApiProperty({ enum: ["voice", "text"], example: "voice" })
  mode: "voice" | "text";

  @ApiProperty({
    example:
      "Sardor, birhadlarni qo'shganda faqat koeffitsiyentlar qo'shiladi, harfiy qism o'zgarmaydi.",
    description: "What the student said (speech-to-text) or typed",
  })
  transcript: string;

  @ApiProperty({
    enum: CheckpointOutcome,
    example: CheckpointOutcome.PASSED,
    description:
      "follow_up: answer Sardor's question with the same endpoint; passed / not_yet: the try is judged",
  })
  outcome: CheckpointOutcome;

  @ApiProperty({
    type: SardorLineDto,
    nullable: true,
    description: "Sardor's one follow-up question (outcome follow_up)",
  })
  followUp: SardorLineDto | null;

  @ApiProperty({ type: [String], description: "Key ideas the student covered" })
  matchedIdeas: string[];

  @ApiProperty({ type: [String] })
  missingIdeas: string[];

  @ApiProperty({
    type: [String],
    description: "Wrong claims in the explanation; any one means not passed",
  })
  wrongStatements: string[];

  @ApiProperty({
    nullable: true,
    description:
      "passed: Sardor's thanks; not_yet: a short new explanation of what was missing",
  })
  feedback: string | null;

  @ApiProperty({
    type: CheckpointDto,
    nullable: true,
    description:
      "not_yet: the next try, opened with a new question from Sardor",
  })
  next: CheckpointDto | null;

  @ApiProperty({ enum: MasteryStatus, example: MasteryStatus.MASTERED })
  masteryStatus: MasteryStatus;

  @ApiProperty({
    example: false,
    description:
      "True when this answer was the 3rd not_yet since the last pass and the teacher was notified",
  })
  teacherNotified: boolean;
  @ApiProperty({
    type: NextTopicDto,
    nullable: true,
    description: "passed: the next topic of the textbook, now unlocked",
  })
  nextTopic: NextTopicDto | null;
}

export class CheckpointStatusDto {
  @ApiProperty({ example: 7 })
  topicId: number;

  @ApiProperty({ example: "Birhad va uning standart shakli" })
  topicTitle: string;

  @ApiProperty({ enum: MasteryStatus, example: MasteryStatus.MASTERED })
  masteryStatus: MasteryStatus;

  @ApiProperty({ example: true, description: "topic_mastery.is_mastered" })
  mastered: boolean;

  @ApiProperty({
    example: true,
    description:
      "First topic of its textbook, mastered itself, or the previous topic is mastered (information only)",
  })
  unlocked: boolean;

  @ApiProperty({ example: 2, description: "Judged tries" })
  tries: number;

  @ApiProperty({
    enum: CheckpointResult,
    nullable: true,
    example: CheckpointResult.PASSED,
  })
  lastResult: CheckpointResult | null;

  @ApiProperty({ nullable: true })
  lastTriedAt: Date | null;

  @ApiProperty({ example: 0 })
  notYetSinceLastPass: number;

  @ApiProperty({
    example: false,
    description:
      "3+ not_yet tries since the last pass; the student can continue",
  })
  needsHelp: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    description: "The open try, if any (answer it or start resumes it)",
  })
  openCheckpointId: number | null;
}
