import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Matches, Min } from "class-validator";
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

  @ApiProperty({
    example: 87,
    nullable: true,
    description:
      "The lesson's AI quiz (POST /me/quizzes/:id/start); null when none",
  })
  quizId: number | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description:
      "The lesson's written homework (GET /me/homework/:id); the first one if several; null when none",
  })
  homeworkId: number | null;
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

export class AttendanceQueryDto {
  @ApiPropertyOptional({
    example: "2026-11",
    description: "YYYY-MM; default: this month (school time zone)",
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "month must be YYYY-MM" })
  month?: string;
}

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EXCUSED = "excused",
}

export class AttendanceRecordDto {
  @ApiProperty({ example: "2026-11-10" })
  date: string;

  @ApiProperty({ example: 2, nullable: true })
  period: number | null;

  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({ example: 41 })
  lessonId: number;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @ApiProperty({ example: null, nullable: true })
  note: string | null;
}

export class AttendanceSummaryDto {
  @ApiProperty({ example: 40 })
  present: number;

  @ApiProperty({ example: 2 })
  absent: number;

  @ApiProperty({ example: 1 })
  late: number;

  @ApiProperty({ example: 1 })
  excused: number;

  @ApiProperty({
    example: 95.35,
    nullable: true,
    description:
      "(present + late) / (all records - excused) * 100, two decimals; null when there is nothing to count",
  })
  percent: number | null;
}

export class AttendanceDto {
  @ApiProperty({ example: "2026-11" })
  month: string;

  @ApiProperty({ type: [AttendanceRecordDto], description: "Oldest first" })
  records: AttendanceRecordDto[];

  @ApiProperty({ type: AttendanceSummaryDto })
  summary: AttendanceSummaryDto;
}

export class GradesQueryDto {
  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @ApiPropertyOptional({
    example: 9,
    description:
      "A term of the student's academic year; default: the term containing today (or the last one started)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  termId?: number;
}

export class TermDto {
  @ApiProperty({ example: 9 })
  id: number;

  @ApiProperty({ example: "2-chorak" })
  name: string;

  @ApiProperty({ example: "2026-11-09", nullable: true })
  startsOn: string | null;

  @ApiProperty({ example: "2026-12-27", nullable: true })
  endsOn: string | null;

  @ApiProperty({
    example: true,
    description:
      "The term containing today, or during a break the last one that started (the default term of /me/grades)",
  })
  isCurrent: boolean;
}

export class GradeDto {
  @ApiProperty({ example: 120 })
  id: number;

  @ApiProperty({
    example: "2026-11-10",
    description: "Lesson date, else the day the grade was given",
  })
  date: string;

  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({
    example: "classwork",
    nullable: true,
    description: "classwork, homework, quiz, exam, term",
  })
  kind: string | null;

  @ApiProperty({ example: 5, nullable: true, description: "2-5" })
  value: number | null;

  @ApiProperty({ example: "Faol qatnashdi", nullable: true })
  comment: string | null;

  @ApiProperty({ type: TeacherRefDto })
  teacher: TeacherRefDto;

  @ApiProperty({ example: 61, nullable: true })
  lessonId: number | null;
}

export class SubjectAverageDto {
  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({ example: 4.5, nullable: true, description: "Two decimals" })
  average: number | null;

  @ApiProperty({ example: 8 })
  count: number;
}

export class GradesDto {
  @ApiProperty({ type: TermDto, nullable: true, description: "The term shown" })
  term: TermDto | null;

  @ApiProperty({
    type: [TermDto],
    description: "All terms of the academic year, for a term picker",
  })
  terms: TermDto[];

  @ApiProperty({ type: [GradeDto], description: "Newest first" })
  grades: GradeDto[];

  @ApiProperty({
    type: [SubjectAverageDto],
    description: "Per subject, over the grades listed",
  })
  averages: SubjectAverageDto[];
}
