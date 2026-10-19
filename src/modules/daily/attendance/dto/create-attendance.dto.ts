import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { AttendanceStatus } from "../../../../common/enums";

export class CreateAttendanceDto {
  @ApiProperty({ example: 1, description: "Lesson id" })
  @IsInt()
  @Min(1)
  lessonId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: AttendanceStatus.PRESENT, enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({
    example: "Came with a note from parents",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string | null;
}
