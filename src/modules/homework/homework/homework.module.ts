import { Module } from "@nestjs/common";
import { HomeworkService } from "./homework.service";
import { HomeworkController } from "./homework.controller";
import { Homework } from "./entities/homework.entity";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { Teacher } from "../../identity/teacher/entities/teacher.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassesModule } from "../../school/classes/classes.module";
import { TeacherModule } from "../../identity/teacher/teacher.module";
import { HomeworkSubmission } from "../homework-submissions/entities/homework-submission.entity";
import { JwtModule } from "@nestjs/jwt";
import { FileModule } from "../../../shared/file/file.module";
import { Media } from "../media/entities/media.entity";
import { LessonsModule } from "../../daily/lessons/lessons.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Homework,
      SchoolClass,
      Teacher,
      HomeworkSubmission,
      Media,
    ]),
    ClassesModule,
    TeacherModule,
    LessonsModule,
    JwtModule,
    FileModule,
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
