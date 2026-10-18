import { forwardRef, Module } from "@nestjs/common";
import { ClassesService } from "./classes.service";
import { ClassesController } from "./classes.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SchoolClass } from "./entities/school-class.entity";
import { SubjectsModule } from "../subjects/subjects.module";
import { Homework } from "../../homework/homework/entities/homework.entity";
import { ExamSession } from "../../assessment/exam-sessions/entities/exam-session.entity";
import { JwtModule } from "@nestjs/jwt";
import { TeacherAssignment } from "../teacher-assignments/entities/teacher-assignment.entity";
import { ClassStudent } from "../class-students/entities/class-student.entity";
import { LessonsModule } from "../../daily/lessons/lessons.module";
import { TeacherAssignmentsModule } from "../teacher-assignments/teacher-assignments.module";
import { ClassStudentsModule } from "../class-students/class-students.module";
import { Lesson } from "../../daily/lessons/entities/lesson.entity";
import { AttendanceModule } from "../../../attendance/attendance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolClass,
      Homework,
      ExamSession,
      TeacherAssignment,
      ClassStudent,
      Lesson,
    ]),
    SubjectsModule,
    AttendanceModule,
    forwardRef(() => TeacherAssignmentsModule),
    forwardRef(() => ClassStudentsModule),
    forwardRef(() => LessonsModule),
    JwtModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
