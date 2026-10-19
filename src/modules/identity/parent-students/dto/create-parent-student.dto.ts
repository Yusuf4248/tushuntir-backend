import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";

export class CreateParentStudentDto {
  @ApiProperty({ example: 1, description: "Parent id" })
  @IsInt()
  @Min(1)
  parentId: number;

  @ApiProperty({ example: 2, description: "Student id" })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiPropertyOptional({
    example: "mother",
    enum: ["mother", "father", "guardian"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["mother", "father", "guardian"])
  relation?: string | null;
}
