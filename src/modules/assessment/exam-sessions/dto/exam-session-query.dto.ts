import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class ExamSessionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by school" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by quiz" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quizId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by room" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number;

  @ApiPropertyOptional({ example: 3, description: "Filter by supervisor" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supervisorId?: number;
}
