import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { RoomType } from "../../../../common/enums";

export class CreateRoomDto {
  @ApiProperty({ example: 1, description: "School id" })
  @IsInt()
  @Min(1)
  schoolId: number;

  @ApiPropertyOptional({ example: "Computer lab 1", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional({
    example: RoomType.COMPUTER_LAB,
    enum: RoomType,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType | null;

  @ApiPropertyOptional({
    example: 24,
    minimum: 0,
    maximum: 1000,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  seats?: number | null;
}
