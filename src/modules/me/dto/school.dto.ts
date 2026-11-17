import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";
import { LessonStatus } from "../me.types";
import {
  ClassRefDto,
  RefDto,
  TeacherRefDto,
  TopicRefDto,
} from "./me-responses.dto";

export class TimetableQueryDto {
  @ApiPropertyOptional({
    example: "2026-11-16",
    description:
      "Any date of the week (YYYY-MM-DD); the week runs Monday to Saturday. Default: this week (school time zone)",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "weekStart must be YYYY-MM-DD" })
  weekStart?: string;
}

export class TimetableLessonDto {
  @ApiProperty({
    example: 60,
    nullable: true,
    description:
      "null for a timetable slot that has no lesson record that week (e.g. a future week)",
  })
  lessonId: number | null;

  @ApiProperty({ example: 2, nullable: true })
  period: number | null;

  @ApiProperty({ example: "08:55", nullable: true })
  startsAt: string | null;

  @ApiProperty({ example: "09:40", nullable: true })
  endsAt: string | null;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.FINISHED })
  status: LessonStatus;

  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({ type: TeacherRefDto })
  teacher: TeacherRefDto;

  @ApiProperty({ example: "201-xona", nullable: true })
  room: string | null;

  @ApiProperty({ type: TopicRefDto, nullable: true })
  topic: TopicRefDto | null;

  @ApiProperty({ example: true, description: "The lesson has an AI quiz" })
  hasQuiz: boolean;

  @ApiProperty({
    example: false,
    description: "The lesson has written homework",
  })
  hasHomework: boolean;
}

export class TimetableDayDto {
  @ApiProperty({ example: "2026-11-16" })
  date: string;

  @ApiProperty({ example: 1, description: "1 = Monday … 6 = Saturday" })
  weekday: number;

  @ApiProperty({ type: [TimetableLessonDto] })
  lessons: TimetableLessonDto[];
}

export class TimetableDto {
  @ApiProperty({ example: "2026-11-16" })
  weekStart: string;

  @ApiProperty({ example: "2026-11-21" })
  weekEnd: string;

  @ApiProperty({ example: "Asia/Tashkent" })
  timezone: string;

  @ApiProperty({ type: ClassRefDto, nullable: true })
  class: ClassRefDto | null;

  @ApiProperty({ type: [TimetableDayDto] })
  days: TimetableDayDto[];
}
