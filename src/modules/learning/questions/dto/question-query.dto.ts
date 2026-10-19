import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { QuestionStatus, QuestionType } from "../../../../common/enums";
import { ToBoolean } from "../../../../common/transforms";

export class QuestionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by source chunk" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sourceChunkId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by approver" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  approvedBy?: number;

  @ApiPropertyOptional({
    example: QuestionType.MULTIPLE_CHOICE,
    enum: QuestionType,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 3, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty?: number;

  @ApiPropertyOptional({ example: false, nullable: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  generatedByAi?: boolean;

  @ApiPropertyOptional({
    example: QuestionStatus.DRAFT,
    enum: QuestionStatus,
    description: "Teacher must approve before students see it",
    nullable: true,
  })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;
}
