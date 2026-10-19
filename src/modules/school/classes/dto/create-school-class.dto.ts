import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Shift } from "../../../../common/enums";

export class CreateSchoolClassDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      "School id. Admins may omit it (their own school is used); required for super_admin",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  schoolId?: number;

  @ApiProperty({ example: 1, description: "Academic year id" })
  @IsInt()
  @Min(1)
  academicYearId: number;

  @ApiPropertyOptional({
    example: 3,
    description: "Homeroom teacher id",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  homeroomTeacherId?: number | null;

  @ApiProperty({ example: 7, minimum: 5, maximum: 11 })
  @IsInt()
  @Min(5)
  @Max(11)
  grade: number;

  @ApiProperty({ example: "A" })
  @IsString()
  @MaxLength(5)
  @IsNotEmpty()
  letter: string;

  @ApiPropertyOptional({ example: Shift.FIRST, enum: Shift, nullable: true })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift | null;
}
