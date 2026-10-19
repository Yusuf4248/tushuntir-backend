import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class GradeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Filter by teacher assignment",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherAssignmentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by lesson" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId?: number;

  @ApiPropertyOptional({
    example: "classwork",
    enum: ["classwork", "homework", "quiz", "exam", "term"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["classwork", "homework", "quiz", "exam", "term"])
  kind?: string;
}
