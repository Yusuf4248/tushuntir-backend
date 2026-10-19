import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { SchoolType } from "../../../../common/enums";

export class SchoolQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "Fergana" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  region?: string;

  @ApiPropertyOptional({
    example: "Kokand city",
    description: "Used by the city dashboard",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  district?: string;

  @ApiPropertyOptional({ example: SchoolType.PUBLIC, enum: SchoolType })
  @IsOptional()
  @IsEnum(SchoolType)
  type?: SchoolType;
}
