import { forwardRef, Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { LessonsController } from "./lessons.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lesson } from "./entities/lesson.entity";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";
import { ClassesModule } from "../modules/school/classes/classes.module";
import { Room } from "../modules/school/rooms/entities/room.entity";
import { ClassStudent } from "../modules/school/class-students/entities/class-student.entity";
import { TeacherAssignment } from "../modules/school/teacher-assignments/entities/teacher-assignment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, SchoolClass, Room, ClassStudent, TeacherAssignment]),
    JwtModule,
    forwardRef(() => ClassesModule),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
