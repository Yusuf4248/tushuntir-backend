import { Module } from "@nestjs/common";
import { TeacherService } from "./teacher.service";
import { TeacherController } from "./teacher.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Teacher } from "./entities/teacher.entity";
import { Homework } from "../homeworks/entities/homework.entity";
import { Grade } from "../grades/entities/grade.entity";
import { Exam } from "../exams/entities/exam.entity";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { School } from "../modules/school/schools/entities/school.entity";
import { JwtModule } from "@nestjs/jwt";
import { FileModule } from "../shared/file/file.module";
import { TeacherAssignment } from "../modules/school/teacher-assignments/entities/teacher-assignment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Homework,
      Grade,
      Exam,
      SchoolClass,
      School,
      TeacherAssignment,
    ]),
    JwtModule,
    FileModule,
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
