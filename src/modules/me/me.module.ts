import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiModule } from "../ai/ai.module";
import { CheckpointAttempt } from "../learning/checkpoint-attempts/entities/checkpoint-attempt.entity";
import { QuestionGenerationModule } from "../learning/question-generation/question-generation.module";
import { MeController } from "./me.controller";
import { StudentAttemptsService } from "./student-attempts.service";
import { StudentChatService } from "./student-chat.service";
import { StudentCheckpointService } from "./student-checkpoint.service";
import { StudentPracticeService } from "./student-practice.service";
import { StudentReviewService } from "./student-review.service";
import { StudentScheduleService } from "./student-schedule.service";

/** Student app endpoints under /api/me; every query is limited to the logged-in student. */
@Module({
  imports: [
    AiModule,
    QuestionGenerationModule,
    TypeOrmModule.forFeature([CheckpointAttempt]),
  ],
  controllers: [MeController],
  providers: [
    StudentScheduleService,
    StudentAttemptsService,
    StudentReviewService,
    StudentChatService,
    StudentPracticeService,
    StudentCheckpointService,
  ],
})
export class MeModule {}
