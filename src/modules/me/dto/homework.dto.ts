import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { RefDto, TeacherRefDto } from "./me-responses.dto";

/**
 * Derived per student: new / overdue when nothing is submitted (before / after the deadline),
 * submitted / late (sent after the deadline), checked / returned by the teacher.
 */
export const HOMEWORK_STATUSES = [
  "new",
  "overdue",
  "submitted",
  "late",
  "checked",
  "returned",
] as const;
export type HomeworkStatus = (typeof HOMEWORK_STATUSES)[number];

export class HomeworkQueryDto {
  @ApiPropertyOptional({ enum: HOMEWORK_STATUSES, example: "new" })
  @IsOptional()
  @IsIn(HOMEWORK_STATUSES)
  status?: HomeworkStatus;
}

export class HomeworkItemDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: "Mashqlar 45-48" })
  title: string;

  @ApiProperty({ type: RefDto })
  subject: RefDto;

  @ApiProperty({ example: 61 })
  lessonId: number;

  @ApiProperty({ example: "2026-11-16" })
  lessonDate: string;

  @ApiProperty({ example: "2026-11-18T17:00:00.000Z", nullable: true })
  dueAt: Date | null;

  @ApiProperty({
    enum: HOMEWORK_STATUSES,
    example: "new",
    description:
      "new / overdue: not submitted, before / after the deadline (overdue can still be submitted, it is then late); " +
      "submitted; late: submitted after the deadline; checked / returned by the teacher (returned can be resubmitted)",
  })
  status: HomeworkStatus;

  @ApiProperty({
    example: null,
    nullable: true,
    description: "0-100 once checked",
  })
  score: number | null;

  @ApiProperty({ example: false, description: "The teacher attached files" })
  hasAttachments: boolean;
}

export class FileDto {
  @ApiProperty({ example: 31, description: "media_files id" })
  id: number;

  @ApiProperty({
    example: "/uploads/3f1c0b9e-5a7d-4c21-b8e6-f0a9d2c4e7b1.pdf",
    description: "Relative to the API origin",
  })
  url: string;

  @ApiProperty({ example: "ish.pdf", nullable: true })
  originalName: string | null;

  @ApiProperty({ example: "application/pdf", nullable: true })
  mimeType: string | null;

  @ApiProperty({ example: 182044, nullable: true })
  sizeBytes: number | null;
}

export class MySubmissionDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: "1) 2a + 6  2) 3x^2 - x", nullable: true })
  text: string | null;

  @ApiProperty({ type: [FileDto] })
  files: FileDto[];

  @ApiProperty({
    enum: ["submitted", "late", "checked", "returned"],
    example: "checked",
  })
  status: string;

  @ApiProperty({ example: 90, nullable: true })
  score: number | null;

  @ApiProperty({
    example: "Yaxshi! 3-misolda ishorani tekshiring.",
    nullable: true,
  })
  feedback: string | null;

  @ApiProperty({ nullable: true })
  submittedAt: Date | null;

  @ApiProperty({ nullable: true })
  checkedAt: Date | null;
}

export class HomeworkDetailDto extends HomeworkItemDto {
  @ApiProperty({
    example: "Darslikdagi 45-48 mashqlarni bajaring.",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ type: TeacherRefDto, nullable: true })
  teacher: TeacherRefDto | null;

  @ApiProperty({ type: [FileDto], description: "The teacher's files" })
  attachments: FileDto[];

  @ApiProperty({ type: MySubmissionDto, nullable: true })
  submission: MySubmissionDto | null;
}

export class SubmissionBodyDto {
  @ApiPropertyOptional({
    example: "1) 2a + 6  2) 3x^2 - x",
    description: "Answer text; replaces the previous text when sent",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;
}
