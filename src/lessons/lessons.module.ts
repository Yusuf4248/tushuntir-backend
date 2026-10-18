import { forwardRef, Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { LessonsController } from "./lessons.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lesson } from "./entities/lesson.entity";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";
import { ClassesModule } from "../modules/school/classes/classes.module";
import { Room } from "../rooms/entities/room.entity";
import { GroupStudent } from "../group-students/entities/group-student.entity";
import { GroupTeacher } from "../group-teachers/entities/group-teacher.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, SchoolClass, Room, GroupStudent, GroupTeacher]),
    JwtModule,
    forwardRef(() => ClassesModule),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
