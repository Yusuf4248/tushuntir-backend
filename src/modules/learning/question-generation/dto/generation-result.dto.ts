import { ApiProperty } from "@nestjs/swagger";
import { Question } from "../../questions/entities/question.entity";

export class DroppedQuestionDto {
  @ApiProperty({ example: "2a + 3a ifodani soddalashtiring." })
  prompt: string;

  @ApiProperty({ example: 'self-check answered "6a", key is "5a"' })
  reason: string;
}

export class GenerationResultDto {
  @ApiProperty({ example: 6 })
  topicId: number;

  @ApiProperty({ example: 25, description: "Questions the AI wrote" })
  generated: number;

  @ApiProperty({ example: 21, description: "Questions saved as drafts" })
  saved: number;

  @ApiProperty({ type: [DroppedQuestionDto] })
  dropped: DroppedQuestionDto[];

  @ApiProperty({ type: [Question] })
  questions: Question[];
}

export class ApproveAllResultDto {
  @ApiProperty({ example: 6 })
  topicId: number;

  @ApiProperty({ example: 21, description: "Draft questions approved" })
  approved: number;
}
