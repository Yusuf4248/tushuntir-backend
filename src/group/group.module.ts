import { forwardRef, Module } from "@nestjs/common";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { CoursesModule } from "../courses/courses.module";
import { Homework } from "../homeworks/entities/homework.entity";
import { Payment } from "../payments/entities/payment.entity";
import { Exam } from "../exams/entities/exam.entity";
import { JwtModule } from "@nestjs/jwt";
import { GroupTeacher } from "../group-teachers/entities/group-teacher.entity";
import { GroupStudent } from "../group-students/entities/group-student.entity";
import { LessonsModule } from "../lessons/lessons.module";
import { GroupTeachersModule } from "../group-teachers/group-teachers.module";
import { GroupStudentsModule } from "../group-students/group-students.module";
import { Lesson } from "../lessons/entities/lesson.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      Homework,
      Payment,
      Exam,
      GroupTeacher,
      GroupStudent,
      Lesson,
    ]),
    CoursesModule,
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
