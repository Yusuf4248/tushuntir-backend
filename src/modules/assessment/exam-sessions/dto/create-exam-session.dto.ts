import {
  IsDateString,
  IsEnum,
  IsMilitaryTime,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ExamSessionStatus } from "../entities/exam-session.entity";

export class CreateExamSessionDto {
  @ApiProperty({ example: "Final Exam" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: "Final test for the React subject" })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: "2025-06-01" })
  @IsDateString()
  date: Date;

  @ApiProperty({ enum: ExamSessionStatus, example: ExamSessionStatus.PENDING })
  @IsEnum(ExamSessionStatus)
  status: ExamSessionStatus;

  @ApiProperty({ example: "14:00", description: "Start time (HH:mm)" })
  @IsMilitaryTime()
  start_time: string;

  @ApiProperty({ example: "15:30", description: "End time (HH:mm)" })
  @IsMilitaryTime()
  end_time: string;

  @ApiProperty({ example: 1, description: "Room ID" })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 3, description: "Class ID" })
  @IsNumber()
  classId: number;

  @IsOptional()
  @IsArray()
  teacherId?: number[];
}
