import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class ChapterQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by textbook" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  textbookId?: number;
}
