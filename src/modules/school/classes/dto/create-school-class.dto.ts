import {
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsString,
  IsMilitaryTime,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ClassStatus } from "../entities/school-class.entity";

export class CreateSchoolClassDto {
  @ApiProperty({ example: "Frontend N1" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsInt()
  subjectId: number;

  @ApiProperty({ example: "2025-06-01" })
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: "08:30", description: "Class start time (HH:mm)" })
  @IsNotEmpty()
  @IsMilitaryTime({ message: "start_time format: HH:mm bo'lishi kerak" })
  start_time: string;

  @ApiProperty({ enum: ClassStatus, example: ClassStatus.NEW })
  @IsEnum(ClassStatus)
  status: ClassStatus;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsInt()
  roomId: number;
}
