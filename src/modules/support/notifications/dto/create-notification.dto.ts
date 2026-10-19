import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: "User id" })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiPropertyOptional({
    example: "absence",
    enum: ["grade", "homework_due", "absence", "weekly_progress", "flag"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["grade", "homework_due", "absence", "weekly_progress", "flag"])
  type?: string | null;

  @ApiPropertyOptional({ example: "Absent today", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional({
    example: "Ali was absent from Mathematics (period 2).",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  body?: string | null;

  @ApiPropertyOptional({ example: "2026-10-19T18:02:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  readAt?: string | null;
}
