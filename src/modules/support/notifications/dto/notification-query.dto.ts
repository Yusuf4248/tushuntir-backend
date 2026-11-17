import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by user" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    example: "absence",
    enum: [
      "grade",
      "homework_due",
      "absence",
      "weekly_progress",
      "flag",
      "needs_help",
      "homework_checked",
      "quiz_unlocked",
      "checkpoint_passed",
    ],
    nullable: true,
  })
  @IsOptional()
  @IsIn([
    "grade",
    "homework_due",
    "absence",
    "weekly_progress",
    "flag",
    "needs_help",
    "homework_checked",
    "quiz_unlocked",
    "checkpoint_passed",
  ])
  type?: string;
}
