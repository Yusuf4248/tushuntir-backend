import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class QuizQuestionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by quiz" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quizId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by question" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionId?: number;
}
