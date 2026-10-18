import { Module } from "@nestjs/common";
import { StudentService } from "./student.service";
import { StudentController } from "./student.controller";
import { Student } from "./entities/student.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "../../daily/attendance/entities/attendance.entity";
import { HomeworkSubmission } from "../../homework/homework-submissions/entities/homework-submission.entity";
import { Grade } from "../../daily/grades/entities/grade.entity";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { FileModule } from "../../../shared/file/file.module";
import { JwtModule } from "@nestjs/jwt";
import { Homework } from "../../homework/homework/entities/homework.entity";
import { Media } from "../../homework/media/entities/media.entity";
import { ClassStudent } from "../../school/class-students/entities/class-student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Attendance,
      HomeworkSubmission,
      Grade,
      SchoolClass,
      Homework,
      Media,
      HomeworkSubmission,
      ClassStudent,
    ]),
    FileModule,
    JwtModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
