import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { QuizKind } from "../../../../common/enums";

export class QuizQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by class" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by creator" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  createdBy?: number;

  @ApiPropertyOptional({ example: QuizKind.PRACTICE, enum: QuizKind })
  @IsOptional()
  @IsEnum(QuizKind)
  kind?: QuizKind;
}
