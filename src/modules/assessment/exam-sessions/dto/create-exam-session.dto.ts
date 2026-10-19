import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateExamSessionDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      "School id. Admins may omit it (their own school is used); required for super_admin",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiProperty({ example: 1, description: "A quiz of kind monthly_exam" })
  @IsInt()
  @Min(1)
  quizId: number;

  @ApiPropertyOptional({ example: 1, description: "Room id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @ApiPropertyOptional({
    example: 3,
    description: "Supervisor id",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  supervisorId?: number | null;

  @ApiPropertyOptional({ example: "2026-10-30T09:00:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @ApiPropertyOptional({ example: "2026-10-30T09:45:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  @ApiPropertyOptional({
    example: "K7Q2-PX",
    description: "Entered on the lab computer to unlock exam mode",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  accessCode?: string | null;
}
