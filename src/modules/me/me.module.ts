import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { MeController } from "./me.controller";
import { StudentAttemptsService } from "./student-attempts.service";
import { StudentScheduleService } from "./student-schedule.service";

/** Student app endpoints under /api/me; every query is limited to the logged-in student. */
@Module({
  imports: [AiModule],
  controllers: [MeController],
  providers: [StudentScheduleService, StudentAttemptsService],
})
export class MeModule {}
