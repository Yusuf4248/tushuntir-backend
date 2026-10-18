import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Admin } from "./entities/admin.entity";
import { School } from "../modules/school/schools/entities/school.entity";
import { SchoolsModule } from "../modules/school/schools/schools.module";
import { JwtModule } from "@nestjs/jwt";
import { Teacher } from "../teacher/entities/teacher.entity";
import { Student } from "../student/entities/student.entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, School, Teacher, Student]),
    SchoolsModule,
    JwtModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
