import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { SchoolType } from "../../../../common/enums";

export class CreateSchoolDto {
  @ApiProperty({ example: "School No. 12" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Fergana" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  region: string;

  @ApiProperty({
    example: "Kokand city",
    description: "Used by the city dashboard",
  })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: SchoolType.PUBLIC, enum: SchoolType })
  @IsEnum(SchoolType)
  type: SchoolType;

  @ApiPropertyOptional({
    example: "FRG-0012",
    description: "For a future eMaktab connection",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emaktabId?: string | null;
}
