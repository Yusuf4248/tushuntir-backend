import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { Shift } from "../../../../common/enums";

export class SchoolClassQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by school" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by academic year" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  academicYearId?: number;

  @ApiPropertyOptional({
    example: 3,
    description: "Filter by homeroom teacher",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  homeroomTeacherId?: number;

  @ApiPropertyOptional({ example: 7, minimum: 5, maximum: 11 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(11)
  grade?: number;

  @ApiPropertyOptional({ example: Shift.FIRST, enum: Shift, nullable: true })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;
}
