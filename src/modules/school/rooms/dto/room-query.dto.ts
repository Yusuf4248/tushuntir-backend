import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { RoomType } from "../../../../common/enums";

export class RoomQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by school" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiPropertyOptional({
    example: RoomType.COMPUTER_LAB,
    enum: RoomType,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;
}
