import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
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
