import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  ValidateNested,
  IsArray,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { AttendanceStatus } from "../entities/attendance.entity";

export class StudentAttendanceDto {
  @IsNotEmpty({ message: "Student ID is required" })
  @IsInt({ message: "Student ID must be an integer" })
  @ApiProperty({
    example: 1,
    description: "The unique identifier of the student",
  })
  studentId: number;

  @IsNotEmpty({ message: "Status is required" })
  @IsEnum(AttendanceStatus, { message: "Invalid attendance status" })
  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.CAME,
    description: "The attendance status of the student",
  })
  status: AttendanceStatus;
}

export class UpdateLessonAttendancesDto {
  @IsNotEmpty({ message: "Lesson title is required" })
  @IsString({ message: "Lesson title must be a string" })
  @ApiProperty({
    example: "Math Lesson",
    description: "The title of the lesson",
  })
  lessonTitle: string;

  @IsNotEmpty({ message: "Lesson ID is required" })
  @IsInt({ message: "Lesson ID must be an integer" })
  @ApiProperty({
    example: 101,
    description: "The unique identifier of the lesson",
  })
  lessonId: number;

  @IsNotEmpty({ message: "Students array is required" })
  @IsArray({ message: "Students must be an array" })
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  @ApiProperty({
    type: [StudentAttendanceDto],
    description: "Array of student attendance records",
  })
  students: StudentAttendanceDto[];
}
