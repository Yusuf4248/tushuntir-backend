import { Module } from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { ExamsController } from "./exams.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Exam } from "./entities/exam.entity";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { Room } from "../rooms/entities/room.entity";
import { RoomsModule } from "../rooms/rooms.module";
import { ClassesModule } from "../modules/school/classes/classes.module";
import { Teacher } from "../teacher/entities/teacher.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, SchoolClass, Room, Teacher]),
    RoomsModule,
    ClassesModule,
    JwtModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
