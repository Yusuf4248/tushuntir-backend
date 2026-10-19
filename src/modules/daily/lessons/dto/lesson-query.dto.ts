import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Matches, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { DATE_ONLY } from "../../../../common/transforms";

export class LessonQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: "Filter by teacher assignment",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherAssignmentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by timetable slot" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timetableSlotId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({ example: "2026-10-19" })
  @IsOptional()
  @Matches(DATE_ONLY, { message: "date must be a date (YYYY-MM-DD)" })
  date?: string;
}
