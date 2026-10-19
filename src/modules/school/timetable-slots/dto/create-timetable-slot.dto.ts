import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Matches, Max, Min } from "class-validator";
import { TIME_OF_DAY } from "../../../../common/transforms";

export class CreateTimetableSlotDto {
  @ApiProperty({ example: 1, description: "Teacher assignment id" })
  @IsInt()
  @Min(1)
  teacherAssignmentId: number;

  @ApiPropertyOptional({ example: 1, description: "Room id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @ApiPropertyOptional({ example: 1, description: "Term id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  termId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: "1 = Monday ... 6 = Saturday",
    minimum: 1,
    maximum: 6,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  weekday?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: "Lesson number in the day",
    minimum: 1,
    maximum: 12,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  period?: number | null;

  @ApiPropertyOptional({ example: "08:55", nullable: true })
  @IsOptional()
  @Matches(TIME_OF_DAY, { message: "startsAt must be a time (HH:mm)" })
  startsAt?: string | null;

  @ApiPropertyOptional({ example: "09:40", nullable: true })
  @IsOptional()
  @Matches(TIME_OF_DAY, { message: "endsAt must be a time (HH:mm)" })
  endsAt?: string | null;
}
