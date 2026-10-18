import { forwardRef, Module } from "@nestjs/common";
import { ClassesService } from "./classes.service";
import { ClassesController } from "./classes.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SchoolClass } from "./entities/school-class.entity";
import { SubjectsModule } from "../subjects/subjects.module";
import { Homework } from "../../../homeworks/entities/homework.entity";
import { Exam } from "../../../exams/entities/exam.entity";
import { JwtModule } from "@nestjs/jwt";
import { GroupTeacher } from "../../../group-teachers/entities/group-teacher.entity";
import { ClassStudent } from "../class-students/entities/class-student.entity";
import { LessonsModule } from "../../../lessons/lessons.module";
import { GroupTeachersModule } from "../../../group-teachers/group-teachers.module";
import { ClassStudentsModule } from "../class-students/class-students.module";
import { Lesson } from "../../../lessons/entities/lesson.entity";
import { AttendanceModule } from "../../../attendance/attendance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolClass,
      Homework,
      Exam,
      GroupTeacher,
      ClassStudent,
      Lesson,
    ]),
    SubjectsModule,
    AttendanceModule,
    forwardRef(() => GroupTeachersModule),
    forwardRef(() => ClassStudentsModule),
    forwardRef(() => LessonsModule),
    JwtModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
