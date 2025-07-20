import { forwardRef, Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { LessonsController } from "./lessons.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lesson } from "./entities/lesson.entity";
import { Group } from "../group/entities/group.entity";
import { JwtModule } from "@nestjs/jwt";
import { GroupModule } from "../group/group.module";
import { Room } from "../rooms/entities/room.entity";
import { GroupStudent } from "../group-students/entities/group-student.entity";
import { GroupTeacher } from "../group-teachers/entities/group-teacher.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, Group, Room, GroupStudent, GroupTeacher]),
    JwtModule,
    forwardRef(() => GroupModule),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
