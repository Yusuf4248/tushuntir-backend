import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateExamSessionStudentDto {
  @ApiProperty({ example: 1, description: "Exam session id" })
  @IsInt()
  @Min(1)
  examSessionId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiPropertyOptional({ example: "PC-07", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  seat?: string | null;

  @ApiPropertyOptional({
    example: "present",
    enum: ["present", "absent"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["present", "absent"])
  status?: string | null;
}
