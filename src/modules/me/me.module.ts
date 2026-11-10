import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { QuestionGenerationModule } from "../learning/question-generation/question-generation.module";
import { MeController } from "./me.controller";
import { StudentAttemptsService } from "./student-attempts.service";
import { StudentReviewService } from "./student-review.service";
import { StudentScheduleService } from "./student-schedule.service";

/** Student app endpoints under /api/me; every query is limited to the logged-in student. */
@Module({
  imports: [AiModule, QuestionGenerationModule],
  controllers: [MeController],
  providers: [
    StudentScheduleService,
    StudentAttemptsService,
    StudentReviewService,
  ],
})
export class MeModule {}
