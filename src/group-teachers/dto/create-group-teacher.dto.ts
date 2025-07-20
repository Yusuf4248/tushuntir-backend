import { ApiProperty } from "@nestjs/swagger";
import {
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

  @ApiProperty({ example: 5, description: "Teacher ID" })
  @IsNumber()
  @IsNotEmpty()
  teacherId: number;

  @ApiProperty({
    example: true,
    description: "Status of the teacher in the group (active/inactive)",
  })
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;

  @ApiProperty({
    example: "2025-01-01",
    description: "Start date of the group",
  })
  @IsDateString()
  @IsOptional()
  start_date?: Date;

  @ApiProperty({
    example: "2025-12-01",
    description: "End date of the group",
  })
  @IsDateString()
  @IsOptional()
  end_date?: Date;
}
