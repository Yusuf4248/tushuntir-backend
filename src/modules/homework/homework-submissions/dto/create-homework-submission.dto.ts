import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { SubmissionStatus } from "../../../../common/enums";

export class CreateHomeworkSubmissionDto {
  @ApiProperty({ example: 1, description: "Homework id" })
  @IsInt()
  @Min(1)
  homeworkId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiPropertyOptional({ example: "1) 3/4  2) 5/7 ...", nullable: true })
  @IsOptional()
  @IsString()
  answerText?: string | null;

  @ApiPropertyOptional({
    example: SubmissionStatus.SUBMITTED,
    enum: SubmissionStatus,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus | null;

  @ApiPropertyOptional({
    example: 90,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number | null;

  @ApiPropertyOptional({ example: "Check exercise 4 again", nullable: true })
  @IsOptional()
  @IsString()
  feedback?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsISO8601()
  submittedAt?: string | null;
}
