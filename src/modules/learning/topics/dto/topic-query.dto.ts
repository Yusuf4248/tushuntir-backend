import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { ToBoolean } from "../../../../common/transforms";

export class TopicQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by chapter" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chapterId?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Appears in the university entrance exam",
    nullable: true,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isExamTopic?: boolean;
}
