import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StudentModule } from "./student/student.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminModule } from "./admin/admin.module";
import { TeacherModule } from "./teacher/teacher.module";
import { AuthModule } from "./auth/auth.module";
import { CoursesModule } from "./courses/courses.module";
import { GroupModule } from "./group/group.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { HomeworksModule } from "./homeworks/homeworks.module";
import { HomeworkSubmissionModule } from "./homework-submission/homework-submission.module";
import { GradesModule } from "./grades/grades.module";
import { BranchesModule } from "./branches/branches.module";
import { RoomsModule } from "./rooms/rooms.module";
import { ExamsModule } from "./exams/exams.module";
import { ExamResultsModule } from "./exam-results/exam-results.module";
import { MediaModule } from "./media/media.module";
import { MailModule } from "./mail/mail.module";
import { FileModule } from "./file/file.module";
import { LessonsModule } from "./lessons/lessons.module";
import { GroupTeachersModule } from "./group-teachers/group-teachers.module";
import { GroupStudentsModule } from "./group-students/group-students.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { DataSource } from "typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "static"),
    }),
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
    CoursesModule,
    GroupModule,
    LessonsModule,
    GroupTeachersModule,
    GroupStudentsModule,
    AttendanceModule,
    HomeworksModule,
    HomeworkSubmissionModule,
    GradesModule,
    BranchesModule,
    RoomsModule,
    ExamsModule,
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
