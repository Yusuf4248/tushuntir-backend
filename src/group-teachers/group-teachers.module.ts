import { Module } from "@nestjs/common";
import { GroupTeachersService } from "./group-teachers.service";
import { GroupTeachersController } from "./group-teachers.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GroupTeacher } from "./entities/group-teacher.entity";
import { Teacher } from "../teacher/entities/teacher.entity";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupTeacher, Teacher, SchoolClass]),
    JwtModule,
  ],
  controllers: [GroupTeachersController],
  providers: [GroupTeachersService],
  exports: [GroupTeachersService],
})
export class GroupTeachersModule {}
