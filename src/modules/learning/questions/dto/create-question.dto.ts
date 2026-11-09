import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { QuestionType } from "../../../../common/enums";

export class CreateQuestionDto {
  @ApiProperty({ example: 1, description: "Topic id" })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Source chunk id",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  sourceChunkId?: number | null;

  @ApiProperty({ example: QuestionType.MULTIPLE_CHOICE, enum: QuestionType })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: "What is 1/4 + 2/4?" })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({
    example: ["1/4", "3/4", "3/8", "1/2"],
    description: "Multiple choice only: the answer options",
    type: [String],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  options?: string[] | null;

  @ApiProperty({ example: "3/4" })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiPropertyOptional({
    example: "Keep the denominator, add the numerators",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  hint?: string | null;

  @ApiPropertyOptional({
    example: [
      "Qavs oldida qanday ishora turibdi?",
      "Minus qavs ichidagi har bir hadning ishorasini o'zgartiradi.",
      "Masalan: 7 - (2 - 3) = 7 - 2 + 3 = 8.",
    ],
    description:
      "Exactly three hint levels, weakest first: nudge, clue, worked similar example",
    type: [String],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  hints?: string[] | null;

  @ApiPropertyOptional({
    example:
      "Qavs oldida minus bo'lgani uchun har bir hadning ishorasi o'zgaradi.",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  explanation?: string | null;

  @ApiPropertyOptional({
    example: {
      "2a^2 - 6a + 8": "Minus ishorasini faqat birinchi hadga qo'llagan",
    },
    description:
      "Multiple choice only: wrong option text → the misconception choosing it shows",
    type: "object",
    additionalProperties: { type: "string" },
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  optionMisconceptions?: Record<string, string> | null;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 3, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty?: number | null;

  @ApiPropertyOptional({ example: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  generatedByAi?: boolean | null;
}
