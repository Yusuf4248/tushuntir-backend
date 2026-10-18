import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StudentModule } from "./student/student.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminModule } from "./admin/admin.module";
import { TeacherModule } from "./teacher/teacher.module";
import { AuthModule } from "./auth/auth.module";
import { SubjectsModule } from "./modules/school/subjects/subjects.module";
import { ClassesModule } from "./modules/school/classes/classes.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { HomeworkModule } from "./modules/homework/homework/homework.module";
import { HomeworkSubmissionsModule } from "./modules/homework/homework-submissions/homework-submissions.module";
import { GradesModule } from "./grades/grades.module";
import { SchoolsModule } from "./modules/school/schools/schools.module";
import { RoomsModule } from "./rooms/rooms.module";
import { ExamSessionsModule } from "./modules/assessment/exam-sessions/exam-sessions.module";
import { ExamResultsModule } from "./exam-results/exam-results.module";
import { MediaModule } from "./media/media.module";
import { MailModule } from "./shared/mail/mail.module";
import { FileModule } from "./shared/file/file.module";
import { LessonsModule } from "./lessons/lessons.module";
import { TeacherAssignmentsModule } from "./modules/school/teacher-assignments/teacher-assignments.module";
import { ClassStudentsModule } from "./modules/school/class-students/class-students.module";
import { DataSource } from "typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DB,
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
      dropSchema: false,
    }),
    StudentModule,
    AdminModule,
    TeacherModule,
    AuthModule,
    SubjectsModule,
    ClassesModule,
    LessonsModule,
    TeacherAssignmentsModule,
    ClassStudentsModule,
    AttendanceModule,
    HomeworkModule,
    HomeworkSubmissionsModule,
    GradesModule,
    SchoolsModule,
    RoomsModule,
    ExamSessionsModule,
    ExamResultsModule,
    MediaModule,
    MailModule,
    FileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
