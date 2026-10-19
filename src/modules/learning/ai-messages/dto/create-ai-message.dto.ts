import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateAiMessageDto {
  @ApiProperty({ example: 1, description: "AI session id" })
  @IsInt()
  @Min(1)
  sessionId: number;

  @ApiPropertyOptional({
    example: "student",
    enum: ["student", "assistant"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["student", "assistant"])
  role?: string | null;

  @ApiProperty({ example: "Why do we keep the denominator?" })
  @IsString()
  @IsNotEmpty()
  content: string;
}
