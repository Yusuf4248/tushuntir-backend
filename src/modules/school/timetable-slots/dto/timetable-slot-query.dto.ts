import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class TimetableSlotQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: "Filter by teacher assignment",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherAssignmentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by room" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by term" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  termId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "1 = Monday ... 6 = Saturday",
    minimum: 1,
    maximum: 6,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  weekday?: number;
}
