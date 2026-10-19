import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamSession } from "./entities/exam-session.entity";
import { ExamSessionsController } from "./exam-sessions.controller";
import { ExamSessionsService } from "./exam-sessions.service";

@Module({
  imports: [TypeOrmModule.forFeature([ExamSession])],
  controllers: [ExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService],
})
export class ExamSessionsModule {}
