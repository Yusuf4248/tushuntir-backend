import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";

export class CreateMediaDto {
  @ApiProperty({
    example: "https://domain.com/uploads/file.pdf",
    description: "Fayl URL manzili",
  })
  @IsString()
  @IsNotEmpty()
  files: string;

  @ApiProperty({ example: "file.pdf", description: "Yuklangan fayl nomi" })
  @IsString()
  @IsNotEmpty()
  file_name: string;
}
