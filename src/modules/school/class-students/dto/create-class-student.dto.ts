import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Matches, Min } from "class-validator";
import { DATE_ONLY } from "../../../../common/transforms";

export class CreateClassStudentDto {
  @ApiProperty({ example: 1, description: "Class id" })
  @IsInt()
  @Min(1)
  classId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiPropertyOptional({ example: "2026-09-02", nullable: true })
  @IsOptional()
  @Matches(DATE_ONLY, { message: "joinedOn must be a date (YYYY-MM-DD)" })
  joinedOn?: string | null;
}
