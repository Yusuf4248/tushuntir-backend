import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { AttendanceStatus } from "../../../../common/enums";

export class AttendanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by lesson" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId?: number;

  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({
    example: AttendanceStatus.PRESENT,
    enum: AttendanceStatus,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
