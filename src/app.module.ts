import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/identity/auth/auth.module";
import { SchoolsModule } from "./modules/school/schools/schools.module";
import { UsersModule } from "./modules/identity/users/users.module";
import { ParentStudentsModule } from "./modules/identity/parent-students/parent-students.module";
import { SubjectsModule } from "./modules/school/subjects/subjects.module";
import { MailModule } from "./shared/mail/mail.module";
import { FileModule } from "./shared/file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    DatabaseModule,
    AuthModule,
    SchoolsModule,
    UsersModule,
    ParentStudentsModule,
    SubjectsModule,
    MailModule,
    FileModule,
  ],
})
export class AppModule {}
