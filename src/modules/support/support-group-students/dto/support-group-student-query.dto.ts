import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { ToBoolean } from "../../../../common/transforms";

export class SupportGroupStudentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by support group" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supportGroupId?: number;

  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  attended?: boolean;
}
