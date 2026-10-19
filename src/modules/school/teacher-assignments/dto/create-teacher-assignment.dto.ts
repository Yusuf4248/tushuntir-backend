import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class CreateTeacherAssignmentDto {
  @ApiProperty({ example: 3, description: "Teacher id" })
  @IsInt()
  @Min(1)
  teacherId: number;

  @ApiProperty({ example: 1, description: "Class id" })
  @IsInt()
  @Min(1)
  classId: number;

  @ApiProperty({ example: 1, description: "Subject id" })
  @IsInt()
  @Min(1)
  subjectId: number;
}
