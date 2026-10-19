import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSubjectDto {
  @ApiProperty({ example: "Mathematics" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "MATH", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string | null;
}
