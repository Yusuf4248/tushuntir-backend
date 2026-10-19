import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { SubmissionStatus } from "../../../../common/enums";

export class HomeworkSubmissionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by homework" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  homeworkId?: number;

  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by checker" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  checkedBy?: number;

  @ApiPropertyOptional({
    example: SubmissionStatus.SUBMITTED,
    enum: SubmissionStatus,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}
