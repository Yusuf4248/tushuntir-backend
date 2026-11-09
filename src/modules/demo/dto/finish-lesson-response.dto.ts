import { ApiProperty } from "@nestjs/swagger";

export class FinishedLessonQuizDto {
  @ApiProperty({ example: 13 })
  id: number;

  @ApiProperty({
    example: "Algebraik ifoda va uning qiymati: dars bo'yicha test",
    nullable: true,
  })
  title: string | null;

  @ApiProperty({ example: "2026-11-09T17:00:00.000Z", nullable: true })
  dueAt: Date | null;
}

export class FinishLessonResponseDto {
  @ApiProperty({ example: 8 })
  lessonId: number;

  @ApiProperty({ example: "2026-11-09T05:10:00.000Z" })
  endedAt: Date;

  @ApiProperty({ type: FinishedLessonQuizDto, nullable: true })
  quiz: FinishedLessonQuizDto | null;
}
