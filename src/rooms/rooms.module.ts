import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { RoomsController } from "./rooms.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Room } from "./entities/room.entity";
import { School } from "../modules/school/schools/entities/school.entity";
import { SchoolsModule } from "../modules/school/schools/schools.module";
import { ExamSession } from "../modules/assessment/exam-sessions/entities/exam-session.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, School, ExamSession]),
    SchoolsModule,
    JwtModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
