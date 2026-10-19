import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

/** Admin reset of another user's password. */
export class SetPasswordDto {
  @ApiProperty({ example: "N3wPassw0rd", minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
