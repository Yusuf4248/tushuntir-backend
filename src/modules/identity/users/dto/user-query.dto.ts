import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { UserRole } from "../../../../common/enums";
import { ToBoolean } from "../../../../common/transforms";

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by school" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiPropertyOptional({ example: UserRole.TEACHER, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: "karim",
    description:
      "Case-insensitive match on first name, last name, phone or email",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
