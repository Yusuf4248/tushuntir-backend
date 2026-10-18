import { Module } from "@nestjs/common";
import { ExamSessionsService } from "./exam-sessions.service";
import { ExamSessionsController } from "./exam-sessions.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamSession } from "./entities/exam-session.entity";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { Room } from "../../school/rooms/entities/room.entity";
import { RoomsModule } from "../../school/rooms/rooms.module";
import { ClassesModule } from "../../school/classes/classes.module";
import { Teacher } from "../../../teacher/entities/teacher.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamSession, SchoolClass, Room, Teacher]),
    RoomsModule,
    ClassesModule,
    JwtModule,
  ],
  controllers: [ExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService],
})
export class ExamSessionsModule {}
