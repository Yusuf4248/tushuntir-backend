import { forwardRef, Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceController } from "./attendance.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Student } from "../student/entities/student.entities";
import { StudentModule } from "../student/student.module";
import { JwtModule } from "@nestjs/jwt";
import { LessonsModule } from "../lessons/lessons.module";
import { ClassesModule } from "../modules/school/classes/classes.module";
import { ClassStudentsModule } from "../modules/school/class-students/class-students.module";
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
