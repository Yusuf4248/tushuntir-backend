import { forwardRef, Module } from "@nestjs/common";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { SubjectsModule } from "../modules/school/subjects/subjects.module";
import { Homework } from "../homeworks/entities/homework.entity";
import { Exam } from "../exams/entities/exam.entity";
import { JwtModule } from "@nestjs/jwt";
import { GroupTeacher } from "../group-teachers/entities/group-teacher.entity";
import { GroupStudent } from "../group-students/entities/group-student.entity";
import { LessonsModule } from "../lessons/lessons.module";
import { GroupTeachersModule } from "../group-teachers/group-teachers.module";
import { GroupStudentsModule } from "../group-students/group-students.module";
import { Lesson } from "../lessons/entities/lesson.entity";
import { AttendanceModule } from "../attendance/attendance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      Homework,
      Exam,
      GroupTeacher,
      GroupStudent,
      Lesson,
    ]),
    SubjectsModule,
    AttendanceModule,
    forwardRef(() => GroupTeachersModule),
    forwardRef(() => GroupStudentsModule),
    forwardRef(() => LessonsModule),
    JwtModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
