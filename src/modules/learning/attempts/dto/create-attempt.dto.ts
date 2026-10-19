import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import { AttemptMode } from "../../../../common/enums";

export class CreateAttemptDto {
  @ApiProperty({ example: 1, description: "Quiz id" })
  @IsInt()
  @Min(1)
  quizId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Required when mode is exam, empty when mode is home",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  examSessionId?: number | null;

  @ApiProperty({
    example: AttemptMode.HOME,
    enum: AttemptMode,
    description: "home = practice, exam = supervised computer room",
  })
  @IsEnum(AttemptMode)
  mode: AttemptMode;

  @ApiPropertyOptional({
    example: 85.5,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  scorePercent?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsISO8601()
  startedAt?: string | null;

  @ApiPropertyOptional({ example: "2026-10-19T10:20:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  finishedAt?: string | null;
}
