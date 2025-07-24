import { forwardRef, Module } from "@nestjs/common";
import { GroupStudentsService } from "./group-students.service";
import { GroupStudentsController } from "./group-students.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GroupStudent } from "./entities/group-student.entity";
import { Student } from "../student/entities/student.entities";
import { Group } from "../group/entities/group.entity";
import { JwtModule } from "@nestjs/jwt";
import { AttendanceModule } from "../attendance/attendance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupStudent, Student, Group]),
    forwardRef(() => AttendanceModule),
    JwtModule,
  ],
  controllers: [GroupStudentsController],
  providers: [GroupStudentsService],
  exports: [GroupStudentsService],
})
export class GroupStudentsModule {}
