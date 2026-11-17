import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiModule } from "../ai/ai.module";
import { CheckpointAttempt } from "../learning/checkpoint-attempts/entities/checkpoint-attempt.entity";
import { QuestionGenerationModule } from "../learning/question-generation/question-generation.module";
import { MeController } from "./me.controller";
import { MeSchoolController } from "./me-school.controller";
import { StudentAttemptsService } from "./student-attempts.service";
import { StudentChatService } from "./student-chat.service";
import { StudentCheckpointService } from "./student-checkpoint.service";
import { StudentPracticeService } from "./student-practice.service";
import { StudentReviewService } from "./student-review.service";
import { StudentScheduleService } from "./student-schedule.service";
import { StudentTopicsService } from "./student-topics.service";
import { StudentSchoolService } from "./student-school.service";

/** Student app endpoints under /api/me; every query is limited to the logged-in student. */
@Module({
  imports: [
    AiModule,
    QuestionGenerationModule,
    TypeOrmModule.forFeature([CheckpointAttempt]),
    // Limits are set per route with @RateLimit; this is only the fallback window.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [MeController, MeSchoolController],
  providers: [
    StudentScheduleService,
    StudentAttemptsService,
    StudentReviewService,
    StudentChatService,
    StudentPracticeService,
    StudentCheckpointService,
    StudentTopicsService,
    StudentSchoolService,
  ],
})
export class MeModule {}
