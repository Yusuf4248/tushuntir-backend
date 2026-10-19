import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "+998901234567", description: "Phone or email" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  login: string;

  @ApiProperty({ example: "Str0ngPassw0rd" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
