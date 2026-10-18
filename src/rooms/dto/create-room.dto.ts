import { IsInt, IsPositive, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoomDto {
  @ApiProperty({
    example: 1,
    description: "Filial ID (schoolId)",
  })
  @IsInt({ message: "schoolId butun son bo'lishi kerak" })
  @IsPositive({ message: "schoolId musbat bo'lishi kerak" })
  schoolId: number;

  @ApiProperty({
    example: "Room A",
    description: "Xona nomi",
  })
  @IsString({ message: "name matn bo'lishi kerak" })
  @MinLength(2, { message: "name kamida 2 ta belgidan iborat bo'lishi kerak" })
  name: string;

  @ApiProperty({
    example: 25,
    description: "Xona sig'imi (nechta odam sig'adi)",
  })
  @IsInt({ message: "capacity butun son bo'lishi kerak" })
  @IsPositive({ message: "capacity musbat son bo'lishi kerak" })
  capacity: number;
}
