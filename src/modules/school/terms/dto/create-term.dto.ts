import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { DATE_ONLY } from "../../../../common/transforms";

export class CreateTermDto {
  @ApiProperty({ example: 1, description: "Academic year id" })
  @IsInt()
  @Min(1)
  academicYearId: number;

  @ApiPropertyOptional({ example: "Term 1", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional({ example: "2026-09-02", nullable: true })
  @IsOptional()
  @Matches(DATE_ONLY, { message: "startsOn must be a date (YYYY-MM-DD)" })
  startsOn?: string | null;

  @ApiPropertyOptional({ example: "2026-10-31", nullable: true })
  @IsOptional()
  @Matches(DATE_ONLY, { message: "endsOn must be a date (YYYY-MM-DD)" })
  endsOn?: string | null;
}
