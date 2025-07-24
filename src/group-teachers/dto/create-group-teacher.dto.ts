import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from "class-validator";

export class CreateGroupTeacherDto {
  @ApiProperty({ example: 2, description: "Group ID" })
  @IsNumber()
  @IsNotEmpty()
  groupId: number;

  @ApiProperty({ example: [5], description: "Teacher ID" })
  @IsArray()
  @IsNotEmpty()
  teacherId: number[];

  @ApiProperty({
    example: true,
    description: "Status of the teacher in the group (active/inactive)",
  })
  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  status?: boolean;

  @ApiProperty({
    example: "2025-01-01",
    description: "Start date of the group",
  })
  @IsDateString()
  @IsOptional()
  start_date?: Date;
}
