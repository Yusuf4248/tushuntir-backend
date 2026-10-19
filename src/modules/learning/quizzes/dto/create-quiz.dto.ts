import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { QuizKind } from "../../../../common/enums";

export class CreateQuizDto {
  @ApiPropertyOptional({ example: 1, description: "Topic id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number | null;

  @ApiPropertyOptional({ example: 1, description: "Class id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  classId?: number | null;

  @ApiProperty({ example: QuizKind.PRACTICE, enum: QuizKind })
  @IsEnum(QuizKind)
  kind: QuizKind;

  @ApiPropertyOptional({ example: "Fractions practice", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 600,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  timeLimitMin?: number | null;

  @ApiPropertyOptional({
    example: true,
    description: "Each student gets a different order",
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean | null;
}
