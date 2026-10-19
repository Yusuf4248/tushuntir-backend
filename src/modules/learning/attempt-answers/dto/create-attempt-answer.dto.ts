import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateAttemptAnswerDto {
  @ApiProperty({ example: 1, description: "Attempt id" })
  @IsInt()
  @Min(1)
  attemptId: number;

  @ApiProperty({ example: 1, description: "Question id" })
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiPropertyOptional({ example: "3/4", nullable: true })
  @IsOptional()
  @IsString()
  answer?: string | null;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean | null;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 10, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  hintsUsed?: number | null;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 100, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  pointsEarned?: number | null;

  @ApiPropertyOptional({
    example: "Correct",
    description: "AI check for short answers",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  aiFeedback?: string | null;
}
