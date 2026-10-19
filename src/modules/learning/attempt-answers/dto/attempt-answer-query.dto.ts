import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { ToBoolean } from "../../../../common/transforms";

export class AttemptAnswerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by attempt" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by question" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionId?: number;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isCorrect?: boolean;
}
