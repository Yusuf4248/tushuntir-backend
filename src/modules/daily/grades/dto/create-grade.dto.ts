import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateGradeDto {
  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 1, description: "Teacher assignment id" })
  @IsInt()
  @Min(1)
  teacherAssignmentId: number;

  @ApiPropertyOptional({ example: 1, description: "Lesson id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  lessonId?: number | null;

  @ApiPropertyOptional({
    example: "classwork",
    enum: ["classwork", "homework", "quiz", "exam", "term"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["classwork", "homework", "quiz", "exam", "term"])
  kind?: string | null;

  @ApiPropertyOptional({
    example: 5,
    description: "2-5 scale",
    minimum: 2,
    maximum: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(5)
  value?: number | null;

  @ApiPropertyOptional({ example: "Good work", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string | null;
}
