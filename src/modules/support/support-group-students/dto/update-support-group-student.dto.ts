import { PartialType } from "@nestjs/swagger";
import { CreateSupportGroupStudentDto } from "./create-support-group-student.dto";

export class UpdateSupportGroupStudentDto extends PartialType(
  CreateSupportGroupStudentDto,
) {}
