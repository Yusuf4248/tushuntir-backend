import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { LessonStatus } from "../entities/lesson.entity";

export class UpdateLessonStatusDto {
  @ApiProperty({ enum: LessonStatus })
  @IsEnum(LessonStatus)
  status: LessonStatus;

  @ApiProperty({ example: "Completed successfully" })
  @IsString()
  note: string;

  @ApiProperty({
    example: "2025-06-01",
    description: "Dars sanasi (optional)",
  })
  @IsDateString()
  @IsOptional()
  date?: Date;
}
