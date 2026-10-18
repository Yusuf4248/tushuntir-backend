import { Module } from "@nestjs/common";
import { StudentService } from "./student.service";
import { StudentController } from "./student.controller";
import { Student } from "./entities/student.entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "../attendance/entities/attendance.entity";
import { HomeworkSubmission } from "../homework-submission/entities/homework-submission.entity";
import { Grade } from "../grades/entities/grade.entity";
import { Group } from "../group/entities/group.entity";
import { FileModule } from "../file/file.module";
import { JwtModule } from "@nestjs/jwt";
import { Homework } from "../homeworks/entities/homework.entity";
import { Media } from "../media/entities/media.entity";
import { GroupStudent } from "../group-students/entities/group-student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Attendance,
      HomeworkSubmission,
      Grade,
      Event,
      Group,
      Homework,
      Media,
      HomeworkSubmission,
      GroupStudent,
    ]),
    FileModule,
    JwtModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
