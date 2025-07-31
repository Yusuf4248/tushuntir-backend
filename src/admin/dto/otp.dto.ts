import { IsEmail, IsNotEmpty, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OtpDto {
  @ApiProperty({ example: 123456, description: "OTP code sent to user email" })
  @IsNumber()
  @IsNotEmpty()
  otp: number;
}
