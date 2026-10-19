import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class ParentStudentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by parent" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({
    example: "mother",
    enum: ["mother", "father", "guardian"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["mother", "father", "guardian"])
  relation?: string;
}
