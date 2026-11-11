import { ApiProperty } from "@nestjs/swagger";
import { MasteryStatus } from "../me.types";

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
