import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "admin@gmail.com",
    description: "admin's email",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "Admin123!",
    description: "admin's password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
