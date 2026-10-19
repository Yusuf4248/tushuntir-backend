import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class HomeworkQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by lesson" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by quiz" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quizId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by creator" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  createdBy?: number;
}
