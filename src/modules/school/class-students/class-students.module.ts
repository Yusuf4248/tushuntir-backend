import { forwardRef, Module } from "@nestjs/common";
import { ClassStudentsService } from "./class-students.service";
import { ClassStudentsController } from "./class-students.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassStudent } from "./entities/class-student.entity";
import { Student } from "../../../student/entities/student.entities";
import { SchoolClass } from "../classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";
import { AttendanceModule } from "../../daily/attendance/attendance.module";
import { LessonsModule } from "../../daily/lessons/lessons.module";
import { Lesson } from "../../daily/lessons/entities/lesson.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassStudent, Student, SchoolClass, Lesson]),
    forwardRef(() => AttendanceModule),
    LessonsModule,
    JwtModule,
  ],
  controllers: [ClassStudentsController],
  providers: [ClassStudentsService],
  exports: [ClassStudentsService],
})
export class ClassStudentsModule {}
