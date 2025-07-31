import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Admin } from "./entities/admin.entity";
import { Branch } from "../branches/entities/branch.entity";
import { BranchesModule } from "../branches/branches.module";
import { JwtModule } from "@nestjs/jwt";
import { Teacher } from "../teacher/entities/teacher.entity";
import { Lid } from "../lid/entities/lid.entity";
import { Student } from "../student/entities/student.entities";
import { LidModule } from "../lid/lid.module";
import { Otp } from "../lid/entities/otp.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Branch, Teacher, Lid, Student, Otp]),
    BranchesModule,
    LidModule,
    JwtModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
