import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsIn, IsInt, IsOptional, Min } from "class-validator";

export class CreateSupportGroupDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      "School id. Admins may omit it (their own school is used); required for super_admin",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiProperty({ example: 1, description: "Topic id" })
  @IsInt()
  @Min(1)
  topicId: number;

  @ApiProperty({ example: 3, description: "Teacher id" })
  @IsInt()
  @Min(1)
  teacherId: number;

  @ApiPropertyOptional({ example: 1, description: "Room id", nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @ApiPropertyOptional({ example: "2026-10-24T14:00:00+05:00", nullable: true })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string | null;

  @ApiPropertyOptional({
    example: "planned",
    enum: ["planned", "done", "cancelled"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["planned", "done", "cancelled"])
  status?: string | null;
}
