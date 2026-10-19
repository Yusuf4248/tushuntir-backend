import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";
import { FlagStatus } from "../../../../common/enums";

export class CreateIntegrityFlagDto {
  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 1, description: "Topic id" })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiProperty({ example: 1, description: "Exam session id" })
  @IsInt()
  @Min(1)
  examSessionId: number;

  @ApiPropertyOptional({
    example: 92,
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
    example: 48,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  examScore?: number | null;

  @ApiPropertyOptional({
    example: 44,
    description: "Home minus exam score",
    minimum: -100,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-100)
  @Max(100)
  gap?: number | null;

  @ApiPropertyOptional({
    example: FlagStatus.OPEN,
    enum: FlagStatus,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(FlagStatus)
  status?: FlagStatus | null;
}
