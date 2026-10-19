import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class CreateQuizQuestionDto {
  @ApiProperty({ example: 1, description: "Quiz id" })
  @IsInt()
  @Min(1)
  quizId: number;

  @ApiProperty({ example: 1, description: "Question id" })
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 500, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  position?: number | null;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 100, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  points?: number | null;
}
