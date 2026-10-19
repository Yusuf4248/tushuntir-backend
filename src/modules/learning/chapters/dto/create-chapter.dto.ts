import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateChapterDto {
  @ApiProperty({ example: 1, description: "Textbook id" })
  @IsInt()
  @Min(1)
  textbookId: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 100, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  number?: number | null;

  @ApiPropertyOptional({ example: "Fractions", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;
}
