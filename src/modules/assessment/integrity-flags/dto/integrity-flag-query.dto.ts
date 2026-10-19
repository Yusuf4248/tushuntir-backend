import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { FlagStatus } from "../../../../common/enums";

export class IntegrityFlagQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by exam session" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examSessionId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by reviewer" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reviewedBy?: number;

  @ApiPropertyOptional({
    example: FlagStatus.OPEN,
    enum: FlagStatus,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(FlagStatus)
  status?: FlagStatus;
}
