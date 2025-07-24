import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsNumber, IsOptional } from "class-validator";

export class UpdateGroupTeacherDto {
  @ApiPropertyOptional({ example: 2, description: "Group ID" })
  @IsNumber()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional({ example: 5, description: "Teacher ID" })
  @IsNumber()
  @IsOptional()
  teacherId?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Status of the teacher in the group (active/inactive)",
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiPropertyOptional({
    example: "2025-01-01",
    description: "Start date of the group",
  })
  @IsDateString()
  @IsOptional()
  start_date?: Date;
}
