import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/** Only the download filename can change; the file itself is replaced by a new upload. */
export class UpdateMediaFileDto {
  @ApiPropertyOptional({
    example: "fractions-worksheet.pdf",
    description: "Filename used for downloads (addition to the DBML)",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName?: string;
}
