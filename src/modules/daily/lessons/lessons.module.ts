import { forwardRef, Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { LessonsController } from "./lessons.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lesson } from "./entities/lesson.entity";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";
import { ClassesModule } from "../../school/classes/classes.module";
import { Room } from "../../school/rooms/entities/room.entity";
import { ClassStudent } from "../../school/class-students/entities/class-student.entity";
import { TeacherAssignment } from "../../school/teacher-assignments/entities/teacher-assignment.entity";

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
