import { Module } from "@nestjs/common";
import { ExamResultsService } from "./exam-results.service";
import { ExamResultsController } from "./exam-results.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamResult } from "./entities/exam-result.entity";
import { ExamSession } from "../modules/assessment/exam-sessions/entities/exam-session.entity";
import { Student } from "../student/entities/student.entities";
import { ExamSessionsModule } from "../modules/assessment/exam-sessions/exam-sessions.module";
import { StudentModule } from "../student/student.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamResult, ExamSession, Student]),
    ExamSessionsModule,
    StudentModule,
  ],
  controllers: [ExamResultsController],
  providers: [ExamResultsService],
})
export class ExamResultsModule {}
