import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class SupportGroupQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by school" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by topic" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @ApiPropertyOptional({ example: 3, description: "Filter by teacher" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by room" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number;

  @ApiPropertyOptional({
    example: "planned",
    enum: ["planned", "done", "cancelled"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["planned", "done", "cancelled"])
  status?: string;
}
