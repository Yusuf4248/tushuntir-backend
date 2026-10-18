import { Module } from "@nestjs/common";
import { TeacherService } from "./teacher.service";
import { TeacherController } from "./teacher.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Teacher } from "./entities/teacher.entity";
import { Homework } from "../homeworks/entities/homework.entity";
import { Grade } from "../grades/entities/grade.entity";
import { Exam } from "../exams/entities/exam.entity";
import { Group } from "../group/entities/group.entity";
import { Branch } from "../branches/entities/branch.entity";
import { JwtModule } from "@nestjs/jwt";
import { FileModule } from "../shared/file/file.module";
import { GroupTeacher } from "../group-teachers/entities/group-teacher.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Homework,
      Grade,
      Exam,
      Group,
      Branch,
      GroupTeacher,
    ]),
    JwtModule,
    FileModule,
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
