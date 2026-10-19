import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsIn, IsInt, IsOptional, Min } from "class-validator";

export class CreateAiSessionDto {
  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 1, description: "Subject id" })
  @IsInt()
  @Min(1)
  subjectId: number;

  @ApiPropertyOptional({ example: 1, description: "Topic id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number | null;

  @ApiPropertyOptional({
    example: "extra_lesson",
    enum: ["study_weak_topic", "extra_lesson"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["study_weak_topic", "extra_lesson"])
  kind?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsISO8601()
  startedAt?: string | null;

  @ApiPropertyOptional({ example: "2026-10-19T16:30:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  endedAt?: string | null;
}
