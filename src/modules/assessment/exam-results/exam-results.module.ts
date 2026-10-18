import { Module } from "@nestjs/common";
import { ExamResultsService } from "./exam-results.service";
import { ExamResultsController } from "./exam-results.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamResult } from "./entities/exam-result.entity";
import { ExamSession } from "../exam-sessions/entities/exam-session.entity";
import { Student } from "../../identity/student/entities/student.entity";
import { ExamSessionsModule } from "../exam-sessions/exam-sessions.module";
import { StudentModule } from "../../identity/student/student.module";

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
