import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { LessonStatus } from "../entities/lesson.entity";

export class UpdateLessonStatusDto {
  @ApiProperty({ enum: LessonStatus })
  @IsEnum(LessonStatus)
  status: LessonStatus;

  @ApiProperty({ example: "Completed successfully" })
  @IsString()
  note: string;
}
