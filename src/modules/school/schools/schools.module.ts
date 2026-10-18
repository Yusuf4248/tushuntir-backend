import { Module } from "@nestjs/common";
import { SchoolsService } from "./schools.service";
import { SchoolsController } from "./schools.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { School } from "./entities/school.entity";
import { Room } from "../rooms/entities/room.entity";
import { Admin } from "../../../admin/entities/admin.entity";
import { Teacher } from "../../../teacher/entities/teacher.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([School, Room, Admin, Teacher]),
    JwtModule,
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
