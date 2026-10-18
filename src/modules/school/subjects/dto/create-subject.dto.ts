import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsNotEmpty,
  IsEnum,
} from "class-validator";
import {
  LessonDurationEnum,
  LessonInAWeekEnum,
  TotalLessonsInMonthEnum,
} from "../entities/subject.entity";

export class CreateSubjectDto {
  @ApiProperty({ example: "Frontend", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: "Learn HTML and JS.",
    description: "Detailed subject description",
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 250000, description: "Price in UZS" })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({
    example: "3",
    description: "Overall subject duration(in month)",
  })
  @IsInt()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({
    enum: LessonInAWeekEnum,
    example: LessonInAWeekEnum.FIVE,
    description: "Number of lessons in a week(3 or 5)",
  })
  @IsEnum(LessonInAWeekEnum)
  @IsNotEmpty()
  lessons_in_a_week: LessonInAWeekEnum;

  @ApiProperty({
    enum: TotalLessonsInMonthEnum,
    example: TotalLessonsInMonthEnum.TWELVE,
    description: "Number of lessons in a month(12 or 20)",
  })
  @IsEnum(TotalLessonsInMonthEnum)
  @IsNotEmpty()
  lessons_in_a_month: TotalLessonsInMonthEnum;

  @ApiProperty({
    enum: LessonDurationEnum,
    example: LessonDurationEnum.MINUTES_240,
    description: "Duration of a single lesson(120, 180, 240, 270 minutes)",
  })
  @IsEnum(LessonDurationEnum)
  @IsNotEmpty()
  lesson_duration: LessonDurationEnum;
}
