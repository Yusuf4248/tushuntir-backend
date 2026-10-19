import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { ToBoolean } from "../../../../common/transforms";

export class TopicMasteryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({ example: false, nullable: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isMastered?: boolean;
}
