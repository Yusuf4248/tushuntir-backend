import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Matches, Min } from "class-validator";
import { DATE_ONLY } from "../../../../common/transforms";

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: "Teacher assignment id" })
  @IsInt()
  @Min(1)
  teacherAssignmentId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Timetable slot id",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timetableSlotId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: "What was taught; links the lesson to the AI quiz",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number | null;

  @ApiProperty({ example: "2026-10-19" })
  @Matches(DATE_ONLY, { message: "date must be a date (YYYY-MM-DD)" })
  date: string;

  @ApiPropertyOptional({
    example: "Introduced like denominators",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
