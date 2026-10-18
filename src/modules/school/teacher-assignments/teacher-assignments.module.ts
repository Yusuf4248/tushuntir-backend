import { Module } from "@nestjs/common";
import { TeacherAssignmentsService } from "./teacher-assignments.service";
import { TeacherAssignmentsController } from "./teacher-assignments.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeacherAssignment } from "./entities/teacher-assignment.entity";
import { Teacher } from "../../identity/teacher/entities/teacher.entity";
import { SchoolClass } from "../classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherAssignment, Teacher, SchoolClass]),
    JwtModule,
  ],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService],
  exports: [TeacherAssignmentsService],
})
export class TeacherAssignmentsModule {}
