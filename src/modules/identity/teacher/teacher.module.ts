import { Module } from "@nestjs/common";
import { TeacherService } from "./teacher.service";
import { TeacherController } from "./teacher.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Teacher } from "./entities/teacher.entity";
import { Homework } from "../../homework/homework/entities/homework.entity";
import { Grade } from "../../daily/grades/entities/grade.entity";
import { ExamSession } from "../../assessment/exam-sessions/entities/exam-session.entity";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { School } from "../../school/schools/entities/school.entity";
import { JwtModule } from "@nestjs/jwt";
import { FileModule } from "../../../shared/file/file.module";
import { TeacherAssignment } from "../../school/teacher-assignments/entities/teacher-assignment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Homework,
      Grade,
      ExamSession,
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
