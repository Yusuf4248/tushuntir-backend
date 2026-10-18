import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateGroupStudentDto {
  @ApiPropertyOptional({
    example: 2,
    description: "Class ID",
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  classId?: number;

  @ApiProperty({
    example: 5,
    description: "Student ID",
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  @Type(() => Number)
  studentId?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Status of the student in the class (active/inactive)",
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @ApiPropertyOptional({ example: "2025-01-01" })
  @IsDateString()
  @IsOptional()
  start_date?: string;
}
