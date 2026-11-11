import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
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

  @ApiPropertyOptional({
    example: ["Faqat suratlar qo'shiladi, maxraj o'zgarmaydi"],
    description: "Main ideas a student must be able to explain",
    type: [String],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(300, { each: true })
  keyIdeas?: string[] | null;

  @ApiPropertyOptional({
    example:
      "Algebraik ifoda sonlar, harflar va amal belgilaridan tuziladi. Uning qiymatini topish uchun harflar o'rniga sonlar qo'yiladi.",
    description: "Short summary shown on the student's topic page",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string | null;
}
