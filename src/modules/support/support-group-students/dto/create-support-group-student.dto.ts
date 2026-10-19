import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class CreateSupportGroupStudentDto {
  @ApiProperty({ example: 1, description: "Support group id" })
  @IsInt()
  @Min(1)
  supportGroupId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @IsBoolean()
  attended?: boolean | null;
}
