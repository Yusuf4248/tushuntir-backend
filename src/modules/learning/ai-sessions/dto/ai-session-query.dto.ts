import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class AiSessionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by subject" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({
    example: "extra_lesson",
    enum: ["study", "study_weak_topic", "extra_lesson"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["study", "study_weak_topic", "extra_lesson"])
  kind?: string;
}
