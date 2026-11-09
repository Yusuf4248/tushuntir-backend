import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateTextbookChunkDto {
  @ApiProperty({ example: 1, description: "Topic id" })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiPropertyOptional({
    example: 42,
    minimum: 1,
    maximum: 2000,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  page?: number | null;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    maximum: 500,
    description: "Order of the chunk inside its topic",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  position?: number | null;

  @ApiProperty({
    example:
      "To add fractions with the same denominator, add the numerators...",
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
