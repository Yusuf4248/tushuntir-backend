import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { AttendanceStatus } from "../../../../common/enums";

export class BulkAttendanceItemDto {
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

export class BulkAttendanceDto {
  @ApiProperty({ example: 1, description: "Lesson id" })
  @IsInt()
  @Min(1)
  lessonId: number;

  @ApiProperty({ type: [BulkAttendanceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  items: BulkAttendanceItemDto[];
}
