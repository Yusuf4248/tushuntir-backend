import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
} from "class-validator";

export class CreateHomeworkSubmissionDto {
  @ApiProperty({ example: 1, description: "Talabaning ID raqami" })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({ example: 4, description: "Uy vazifasining ID raqami" })
  @IsInt()
  @IsNotEmpty()
  homeworkId: number;

  @ApiProperty({
    example: "Vazifa murakkab edi, lekin bajardim.",
    description: "Izoh (ixtiyoriy)",
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
