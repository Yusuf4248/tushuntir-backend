import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import {
  STUDY_CHAT_ACTIONS,
  StudyChatAction,
} from "../../ai/prompts/study-chat.prompt";
import { MasteryStatus } from "../me.types";

export class CreateChatSessionDto {
  @ApiProperty({ example: 8, description: "Topic to study" })
  @IsInt()
  @Min(1)
  topicId: number;
}

export class ChatMessageDto {
  @ApiPropertyOptional({
    example: "Nega qavs oldida minus bo'lsa ishoralar o'zgaradi?",
    description: "Required unless an action is given",
  })
  @ValidateIf((dto: ChatMessageDto) => !dto.action || dto.text !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text?: string;

  @ApiPropertyOptional({
    example:
      "Qavs oldida minus ishorasi tursa, qavs ichidagi har bir hadning ishorasi qarama-qarshisiga o'zgaradi.",
    description: "A passage the student highlighted in the textbook",
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  selectedText?: string;

  @ApiPropertyOptional({ enum: STUDY_CHAT_ACTIONS, example: "explain_simple" })
  @IsOptional()
  @IsIn(STUDY_CHAT_ACTIONS)
  action?: StudyChatAction;
}

export class ChatSourceDto {
  @ApiProperty({ example: 14, nullable: true })
  page: number | null;

  @ApiProperty({ example: 17 })
  chunkId: number;
}

export class ChatTurnDto {
  @ApiProperty({ example: 41 })
  id: number;

  @ApiProperty({ example: "assistant", enum: ["student", "assistant"] })
  role: string;

  @ApiProperty({ example: "Qavs oldidagi minus ..." })
  content: string;

  @ApiProperty({ example: "2026-11-10T06:40:00.000Z" })
  createdAt: Date;
}

export class ChatReplyDto extends ChatTurnDto {
  @ApiProperty({
    type: [ChatSourceDto],
    description: "Textbook pages the answer is based on",
  })
  sources: ChatSourceDto[];

  @ApiProperty({
    example: true,
    description: "false when the textbook text does not cover the question",
  })
  covered: boolean;

  @ApiProperty({
    example: true,
    description: "false when the student went off the school topic",
  })
  onTopic: boolean;

  @ApiProperty({ example: "uz", enum: ["uz", "ru"] })
  language: string;

  @ApiProperty({
    example: null,
    nullable: true,
    enum: ["open_quiz"],
    description:
      "open_quiz: the question matches one in the student's open quiz, so it was not answered",
  })
  refused: string | null;
}

export class ChatExchangeDto {
  @ApiProperty({ example: 12 })
  sessionId: number;

  @ApiProperty({ type: ChatTurnDto })
  message: ChatTurnDto;

  @ApiProperty({ type: ChatReplyDto })
  reply: ChatReplyDto;
}

export class ChatSessionDto {
  @ApiProperty({ example: 12 })
  sessionId: number;

  @ApiProperty({ example: 8 })
  topicId: number;

  @ApiProperty({ example: "Ko'phadlarni qo'shish va ayirish" })
  topicTitle: string;

  @ApiProperty({ example: "2026-11-10T06:39:00.000Z" })
  startedAt: Date;

  @ApiProperty({ type: [ChatTurnDto] })
  messages: ChatTurnDto[];
}

export class WeakTopicDto {
  @ApiProperty({ example: 8 })
  topicId: number;

  @ApiProperty({ example: "Ko'phadlarni qo'shish va ayirish" })
  title: string;

  @ApiProperty({ example: "Algebra" })
  subject: string;

  @ApiProperty({ enum: MasteryStatus, example: MasteryStatus.NEEDS_PRACTICE })
  status: MasteryStatus;

  @ApiProperty({ example: 60, nullable: true })
  homeScore: number | null;

  @ApiProperty({
    type: [String],
    example: ["Minus ishorasini faqat birinchi hadga qo'llagan."],
    description:
      "What went wrong in the student's unfixed mistakes in this topic, latest first",
  })
  subSkills: string[];

  @ApiProperty({
    example: 3,
    description: "Wrong answers in this topic not yet fixed",
  })
  openMistakes: number;
}
