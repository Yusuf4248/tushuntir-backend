import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsNumber, IsOptional } from "class-validator";

export class UpdateTeacherAssignmentDto {
  @ApiPropertyOptional({ example: 2, description: "Class ID" })
  @IsNumber()
  @IsOptional()
  classId?: number;

  @ApiPropertyOptional({ example: 5, description: "Teacher ID" })
  @IsNumber()
  @IsOptional()
  teacherId?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Status of the teacher in the class (active/inactive)",
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiPropertyOptional({
    example: "2025-01-01",
    description: "Start date of the class",
  })
  @IsDateString()
  @IsOptional()
  start_date?: Date;
}
