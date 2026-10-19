import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class QuizQuestionItemDto {
  @ApiProperty({ example: 4, description: "Question id" })
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  points?: number;
}

export class ReplaceQuizQuestionsDto {
  @ApiProperty({
    type: [QuizQuestionItemDto],
    description:
      "The full, ordered list; position is taken from the order. An empty list removes all questions.",
  })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionItemDto)
  questions: QuizQuestionItemDto[];
}
