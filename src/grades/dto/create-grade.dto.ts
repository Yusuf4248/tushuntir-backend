import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  Min,
  Max,
} from "class-validator";

export class CreateGradeDto {
  @ApiProperty({ example: 1, description: "Student ID" })
  @IsInt()
  @IsPositive()
  studentId: number;

  @ApiProperty({ example: 10, description: "Homework submission ID" })
  @IsInt()
  @IsPositive()
  homeworkSubmissionId: number;

  @ApiProperty({ example: 5, description: "Teacher ID" })
  @IsInt()
  @IsPositive()
  teacherId: number;

  @ApiProperty({ example: 85, description: "Grade (0 to 100)" })
  @IsInt()
  @Min(0)
  grade: number;

  @ApiProperty({
    example: "Good work!",
    description: "Optional comment from teacher",
    required: false,
  })
  @IsOptional()
  @IsString()
  comment: string;
}
