import { IsNotEmpty, IsNumber, IsString, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateHomeworkDto {
  @ApiProperty({
    example: 1,
    description: "Guruh IDsi",
  })
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @ApiProperty({
    example: 1,
    description: "Dars IDsi",
  })
  @IsNumber()
  @IsNotEmpty()
  lessonId: number;

  @ApiProperty({
    example: "3-mavzu bo'yicha mashqlar",
    description: "Topshiriq tavsifi",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: "2025-06-01T23:59:00.000Z",
    description: "Topshiriq muddati (deadline)",
  })
  @IsDateString()
  @IsNotEmpty()
  deadline: Date;
}
