import { forwardRef, Module } from "@nestjs/common";
import { GroupStudentsService } from "./group-students.service";
import { GroupStudentsController } from "./group-students.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GroupStudent } from "./entities/group-student.entity";
import { Student } from "../student/entities/student.entities";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";
import { AttendanceModule } from "../attendance/attendance.module";
import { LessonsModule } from "../lessons/lessons.module";
import { Lesson } from "../lessons/entities/lesson.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupStudent, Student, SchoolClass, Lesson]),
    forwardRef(() => AttendanceModule),
    LessonsModule,
    JwtModule,
  ],
  controllers: [GroupStudentsController],
  providers: [GroupStudentsService],
  exports: [GroupStudentsService],
})
export class GroupStudentsModule {}
