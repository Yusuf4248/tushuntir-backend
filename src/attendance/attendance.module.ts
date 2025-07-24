import { Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceController } from "./attendance.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Student } from "../student/entities/student.entities";
import { StudentModule } from "../student/student.module";
import { JwtModule } from "@nestjs/jwt";
import { LessonsModule } from "../lessons/lessons.module";
import { Group } from "../group/entities/group.entity";
import { GroupModule } from "../group/group.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Student]),
    StudentModule,
    LessonsModule,
    GroupModule,
    JwtModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
