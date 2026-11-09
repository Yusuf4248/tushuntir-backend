import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from "class-validator";

export class AnswerDto {
  @ApiProperty({ example: 42, description: "Question id from the attempt" })
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiProperty({
    example: "17",
    description:
      "Multiple choice: the exact option text. Short answer: the student's answer.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  answer: string;
}
