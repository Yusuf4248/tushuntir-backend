import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class NotificationsQueryDto {
  @ApiPropertyOptional({ example: false, description: "Only unread ones" })
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class NotificationDto {
  @ApiProperty({ example: 31 })
  id: number;

  @ApiProperty({
    example: "homework_checked",
    description:
      "grade, homework_checked, homework_due, quiz_unlocked, checkpoint_passed (and the older types)",
  })
  type: string | null;

  @ApiProperty({ example: "Uy vazifasi tekshirildi: Insho", nullable: true })
  title: string | null;

  @ApiProperty({
    example: "Ball: 90. Yaxshi! 3-gapni qayta ko'rib chiq.",
    nullable: true,
  })
  body: string | null;

  @ApiProperty({
    example: { homeworkId: 12, submissionId: 7 },
    nullable: true,
    description:
      "What it is about, for links: homeworkId, quizId, gradeId, subjectId, topicId, lessonId",
  })
  data: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class UnreadCountDto {
  @ApiProperty({ example: 3 })
  count: number;
}

export class ReadAllDto {
  @ApiProperty({ example: 3, description: "How many were marked read" })
  updated: number;
}
