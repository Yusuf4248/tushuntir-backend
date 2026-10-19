import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class TextbookQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by subject" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @ApiPropertyOptional({ example: 7, minimum: 5, maximum: 11 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(11)
  grade?: number;

  @ApiPropertyOptional({ example: "uz", enum: ["uz", "ru"], nullable: true })
  @IsOptional()
  @IsIn(["uz", "ru"])
  language?: string;
}
