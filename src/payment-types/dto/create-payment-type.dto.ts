import { IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentTypeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "Click", description: "To'lov turi nomi" })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "Click orqali to'lov", required: false })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: true,
    description: "Faollik holati",
    required: false,
  })
  is_active?: boolean;
}
