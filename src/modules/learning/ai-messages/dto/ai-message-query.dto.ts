import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class AiMessageQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by ai session" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId?: number;

  @ApiPropertyOptional({
    example: "student",
    enum: ["student", "assistant"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["student", "assistant"])
  role?: string;
}
