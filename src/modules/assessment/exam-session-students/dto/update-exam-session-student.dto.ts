import { PartialType } from "@nestjs/swagger";
import { CreateExamSessionStudentDto } from "./create-exam-session-student.dto";

export class UpdateExamSessionStudentDto extends PartialType(
  CreateExamSessionStudentDto,
) {}
