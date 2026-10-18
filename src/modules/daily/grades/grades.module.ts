import { Module } from "@nestjs/common";
import { GradesService } from "./grades.service";
import { GradesController } from "./grades.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Grade } from "./entities/grade.entity";
import { Teacher } from "../../identity/teacher/entities/teacher.entity";
import { Student } from "../../identity/student/entities/student.entity";
import { HomeworkSubmission } from "../../homework/homework-submissions/entities/homework-submission.entity";
import { TeacherModule } from "../../identity/teacher/teacher.module";
import { StudentModule } from "../../identity/student/student.module";
import { HomeworkSubmissionsModule } from "../../homework/homework-submissions/homework-submissions.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([Grade, Teacher, Student, HomeworkSubmission]),
    TeacherModule,
    StudentModule,
    HomeworkSubmissionsModule,
    JwtModule,
  ],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
