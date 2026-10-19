import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamSessionStudent } from "./entities/exam-session-student.entity";
import { ExamSessionStudentsController } from "./exam-session-students.controller";
import { ExamSessionStudentsService } from "./exam-session-students.service";

@Module({
  imports: [TypeOrmModule.forFeature([ExamSessionStudent])],
  controllers: [ExamSessionStudentsController],
  providers: [ExamSessionStudentsService],
  exports: [ExamSessionStudentsService],
})
export class ExamSessionStudentsModule {}
