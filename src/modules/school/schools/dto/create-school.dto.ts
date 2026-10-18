import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class CreateSchoolDto {
  @ApiProperty({ example: "Chilonzor Filiali", description: "Filial nomi" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Toshkent sh., Chilonzor 5", description: "Manzil" })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: "+998901234567", description: "Qo'ng'iroq raqami" })
  @IsPhoneNumber("UZ")
  @IsNotEmpty()
  call_number: string;
}
