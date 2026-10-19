import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { DATE_ONLY } from "../../../../common/transforms";

export class CreateAcademicYearDto {
  @ApiProperty({ example: 1, description: "School id" })
  @IsInt()
  @Min(1)
  schoolId: number;

  @ApiPropertyOptional({ example: "2026/2027", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional({ example: "2026-09-02", nullable: true })
  @IsOptional()
  @Matches(DATE_ONLY, { message: "startsOn must be a date (YYYY-MM-DD)" })
  startsOn?: string | null;

  @ApiPropertyOptional({ example: "2027-05-25", nullable: true })
  @IsOptional()
  @Matches(DATE_ONLY, { message: "endsOn must be a date (YYYY-MM-DD)" })
  endsOn?: string | null;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean | null;
}
