import { Module } from "@nestjs/common";
import { HomeworkSubmissionsService } from "./homework-submissions.service";
import { HomeworkSubmissionsController } from "./homework-submissions.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HomeworkSubmission } from "./entities/homework-submission.entity";
import { Student } from "../../../student/entities/student.entities";
import { Homework } from "../homework/entities/homework.entity";
import { StudentModule } from "../../../student/student.module";
import { HomeworkModule } from "../homework/homework.module";
import { Grade } from "../../../grades/entities/grade.entity";
import { JwtModule } from "@nestjs/jwt";
import { Media } from "../media/entities/media.entity";
import { FileModule } from "../../../shared/file/file.module";

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
  controllers: [HomeworkSubmissionsController],
  providers: [HomeworkSubmissionsService],
  exports: [HomeworkSubmissionsService],
})
export class HomeworkSubmissionsModule {}
