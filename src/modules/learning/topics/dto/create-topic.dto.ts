import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTopicDto {
  @ApiProperty({ example: 1, description: "Chapter id" })
  @IsInt()
  @Min(1)
  chapterId: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 100, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  position?: number | null;

  @ApiProperty({ example: "Adding fractions" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: true,
    description: "Appears in the university entrance exam",
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  isExamTopic?: boolean | null;
}
