import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsStrongPassword,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateLidDto {
  @ApiProperty({ example: "Ali", description: "Lidning ismi" })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: "Valiyev", description: "Lidning familiyasi" })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    example: "Yaqinlarim",
    description: "Lid qanday qilib bu o'quv markaz haqida eshitgani",
  })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({
    example: "ali@example.com",
    description: "Lidning email manzili",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "MySecret123",
    description: "Parol (kamida 8 ta belgi, harf va raqam bo'lishi kerak)",
  })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: "MySecret123",
    description: "Parolni tasdiqlash",
  })
  @IsString()
  confirm_password: string;
}
