import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsPositive } from "class-validator";

export class CreateExamResultDto {
  @ApiProperty({ example: 87 })
  @IsInt()
  @IsPositive()
  score: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @IsPositive()
  max_score: number;

  @ApiProperty({ example: "2025-05-31" })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 1, description: "Exam ID" })
  @IsInt()
  examId: number;

  @ApiProperty({ example: 2, description: "Student ID" })
  @IsInt()
  studentId: number;
}
