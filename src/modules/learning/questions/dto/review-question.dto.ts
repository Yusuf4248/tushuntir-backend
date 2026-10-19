import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { QuestionStatus } from "../../../../common/enums";

export class ReviewQuestionDto {
  @ApiProperty({
    example: QuestionStatus.APPROVED,
    enum: [QuestionStatus.APPROVED, QuestionStatus.REJECTED],
  })
  @IsIn([QuestionStatus.APPROVED, QuestionStatus.REJECTED])
  status: QuestionStatus.APPROVED | QuestionStatus.REJECTED;
}
