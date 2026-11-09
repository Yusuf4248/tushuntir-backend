import { Module } from "@nestjs/common";
import { AiModule } from "../../ai/ai.module";
import { QuestionGenerationController } from "./question-generation.controller";
import { QuestionGenerationService } from "./question-generation.service";

@Module({
  imports: [AiModule],
  controllers: [QuestionGenerationController],
  providers: [QuestionGenerationService],
  exports: [QuestionGenerationService],
})
export class QuestionGenerationModule {}
