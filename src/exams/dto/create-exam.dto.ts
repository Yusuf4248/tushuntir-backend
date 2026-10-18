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
import { ExamStatus } from "../entities/exam.entity";

export class CreateExamDto {
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

  @ApiProperty({ enum: ExamStatus, example: ExamStatus.PENDING })
  @IsEnum(ExamStatus)
  status: ExamStatus;

  @ApiProperty({ example: "14:00", description: "Start time (HH:mm)" })
  @IsMilitaryTime()
  start_time: string;

  @ApiProperty({ example: "15:30", description: "End time (HH:mm)" })
  @IsMilitaryTime()
  end_time: string;

  @ApiProperty({ example: 1, description: "Room ID" })
  @IsNumber()
  roomId: number;

  @ApiProperty({ example: 3, description: "Group ID" })
  @IsNumber()
  groupId: number;

  @IsOptional()
  @IsArray()
  teacherId?: number[];
}
