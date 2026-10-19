import { PartialType } from "@nestjs/swagger";
import { CreateAttemptAnswerDto } from "./create-attempt-answer.dto";

export class UpdateAttemptAnswerDto extends PartialType(
  CreateAttemptAnswerDto,
) {}
