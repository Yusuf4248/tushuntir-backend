import { forwardRef, Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceController } from "./attendance.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Student } from "../../identity/student/entities/student.entity";
import { StudentModule } from "../../identity/student/student.module";
import { JwtModule } from "@nestjs/jwt";
import { LessonsModule } from "../lessons/lessons.module";
import { ClassesModule } from "../../school/classes/classes.module";
import { ClassStudentsModule } from "../../school/class-students/class-students.module";
import { Lesson } from "../lessons/entities/lesson.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Student, Lesson]),
    forwardRef(() => ClassStudentsModule),
    forwardRef(() => StudentModule),
    forwardRef(() => LessonsModule),
    forwardRef(() => ClassesModule),
    JwtModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
