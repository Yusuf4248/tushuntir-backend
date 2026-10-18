import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateGroupStudentDto {
  @ApiProperty({
    example: 2,
    description: "Class ID",
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  classId: number;

  @ApiProperty({
    example: [5],
    description: "Student ID",
    type: Number,
  })
  @IsArray()
  @IsNotEmpty()
  studentId: number[];

  @ApiProperty({
    example: true,
    description: "Status of the student in the class (active/inactive)",
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean = true;

  @ApiProperty({ example: "2025-01-01" })
  @IsDateString()
  @IsOptional()
  start_date?: string;
}
