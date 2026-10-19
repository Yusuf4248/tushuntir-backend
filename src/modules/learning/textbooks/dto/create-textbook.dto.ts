import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTextbookDto {
  @ApiProperty({ example: 1, description: "Subject id" })
  @IsInt()
  @Min(1)
  subjectId: number;

  @ApiProperty({ example: 7, minimum: 5, maximum: 11 })
  @IsInt()
  @Min(5)
  @Max(11)
  grade: number;

  @ApiPropertyOptional({ example: "Algebra 7", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional({ example: "uz", enum: ["uz", "ru"], nullable: true })
  @IsOptional()
  @IsIn(["uz", "ru"])
  language?: string | null;

  @ApiPropertyOptional({
    example: 2022,
    minimum: 1990,
    maximum: 2100,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  editionYear?: number | null;
}
