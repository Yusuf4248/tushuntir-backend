import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class ExamSessionStudentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by exam session" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examSessionId?: number;

  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({
    example: "present",
    enum: ["present", "absent"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["present", "absent"])
  status?: string;
}
