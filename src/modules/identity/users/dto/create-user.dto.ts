import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { UserRole } from "../../../../common/enums";

/** International phone number: optional +, 7-15 digits. */
export const PHONE_PATTERN = /^\+?\d{7,15}$/;

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      "School id; must be empty for super_admin and set for every other role. Admins default to their own school.",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  schoolId?: number | null;

  @ApiProperty({ example: UserRole.TEACHER, enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: "Dilnoza" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Karimova" })
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    example: "+998901234567",
    description:
      "Phone or email (or both) is required; either can be used to log in",
    nullable: true,
  })
  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message: "phone must be 7-15 digits, optionally starting with +",
  })
  phone?: string | null;

  @ApiPropertyOptional({ example: "dilnoza@school12.uz", nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ example: "Str0ngPassw0rd", minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    example: "uz",
    enum: ["uz", "ru", "en"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["uz", "ru", "en"])
  language?: string | null;

  @ApiPropertyOptional({ example: true, nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean | null;
}
