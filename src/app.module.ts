import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { MailModule } from "./shared/mail/mail.module";
import { FileModule } from "./shared/file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    DatabaseModule,
    MailModule,
    FileModule,
  ],
})
export class AppModule {}
