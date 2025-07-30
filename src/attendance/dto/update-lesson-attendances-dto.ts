import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  ValidateNested,
  IsArray,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { AttendanceStatus } from "../entities/attendance.entity";

export class StudentAttendanceDto {
  @IsNotEmpty({ message: "O'quvchi ID’si talab qilinadi" })
  @IsInt({ message: "O'quvchi ID’si butun son bo'lishi kerak" })
  @ApiProperty({
    example: 1,
    description: "O'quvchining noyob identifikatori",
  })
  studentId: number;

  @IsNotEmpty({ message: "Holati talab qilinadi" })
  @IsEnum(AttendanceStatus, { message: "Noto'g'ri davomat holati" })
  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.CAME,
    description: "O'quvchining davomat holati",
  })
  status: AttendanceStatus;
}

export class UpdateLessonAttendancesDto {
  @IsNotEmpty({ message: "Dars sarlavhasi talab qilinadi" })
  @IsString({ message: "Dars sarlavhasi satr bo'lishi kerak" })
  @ApiProperty({
    example: "Matematika darsi",
    description: "Darsning sarlavhasi",
  })
  lessonTitle: string;

  @IsNotEmpty({ message: "Dars ID’si talab qilinadi" })
  @IsInt({ message: "Dars ID’si butun son bo'lishi kerak" })
  @ApiProperty({
    example: 101,
    description: "Darsning noyob identifikatori",
  })
  lessonId: number;

  @IsNotEmpty({ message: "O'quvchilar massivi talab qilinadi" })
  @IsArray({ message: "O'quvchilar massiv bo'lishi kerak" })
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  @ApiProperty({
    type: [StudentAttendanceDto],
    description: "O'quvchilarning davomat yozuvlari massivi",
  })
  students: StudentAttendanceDto[];
}
