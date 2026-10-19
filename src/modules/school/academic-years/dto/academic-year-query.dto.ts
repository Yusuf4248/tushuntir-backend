import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { ToBoolean } from "../../../../common/transforms";

export class AcademicYearQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by school" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isCurrent?: boolean;
}
