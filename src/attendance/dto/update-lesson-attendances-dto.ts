import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  ValidateNested,
  IsArray,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { AttendanceStatus } from "../entities/attendance.entity";

export class StudentAttendanceDto {
  @IsNotEmpty({ message: "Student ID is required" })
  @IsInt({ message: "Student ID must be an integer" })
  studentId: number;

  @IsNotEmpty({ message: "Status is required" })
  @IsEnum(AttendanceStatus, { message: "Invalid attendance status" })
  status: AttendanceStatus;
}

export class UpdateLessonAttendancesDto {
  @IsNotEmpty({ message: "Lesson title is required" })
  @IsString({ message: "Lesson title must be a string" })
  lessonTitle: string;

  @IsNotEmpty({ message: "Lesson ID is required" })
  @IsInt({ message: "Lesson ID must be an integer" })
  lessonId: number;

  @IsNotEmpty({ message: "Students array is required" })
  @IsArray({ message: "Students must be an array" })
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  students: StudentAttendanceDto[];
}
