import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class CreateTopicMasteryDto {
  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 1, description: "Topic id" })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiPropertyOptional({
    example: 72,
    description: "0-100",
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  mastery?: number | null;

  @ApiPropertyOptional({
    example: 90,
    description: "Latest practice result",
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  homeScore?: number | null;

  @ApiPropertyOptional({
    example: 55,
    description: "Latest supervised exam result",
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  examScore?: number | null;

  @ApiPropertyOptional({ example: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  isMastered?: boolean | null;
}
