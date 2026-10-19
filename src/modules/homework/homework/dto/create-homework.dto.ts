import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateHomeworkDto {
  @ApiProperty({ example: 1, description: "Lesson id" })
  @IsInt()
  @Min(1)
  lessonId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Optional AI quiz attached to the homework",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quizId?: number | null;

  @ApiProperty({ example: "Fractions, exercises 1-10" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: "Solve exercises 1-10 on page 42",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: "2026-10-21T08:00:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;
}
