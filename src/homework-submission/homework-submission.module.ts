import { Module } from "@nestjs/common";
import { HomeworkSubmissionService } from "./homework-submission.service";
import { HomeworkSubmissionController } from "./homework-submission.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HomeworkSubmission } from "./entities/homework-submission.entity";
import { Student } from "../student/entities/student.entities";
import { Homework } from "../modules/homework/homework/entities/homework.entity";
import { StudentModule } from "../student/student.module";
import { HomeworkModule } from "../modules/homework/homework/homework.module";
import { Grade } from "../grades/entities/grade.entity";
import { JwtModule } from "@nestjs/jwt";
import { Media } from "../media/entities/media.entity";
import { FileModule } from "../shared/file/file.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HomeworkSubmission,
      Student,
      Homework,
      Grade,
      Media,
    ]),
    StudentModule,
    HomeworkModule,
    JwtModule,
    FileModule,
  ],
  controllers: [HomeworkSubmissionController],
  providers: [HomeworkSubmissionService],
  exports: [HomeworkSubmissionService],
})
export class HomeworkSubmissionModule {}
