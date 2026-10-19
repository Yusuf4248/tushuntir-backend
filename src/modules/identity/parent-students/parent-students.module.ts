import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParentStudent } from "./entities/parent-student.entity";
import { ParentStudentsController } from "./parent-students.controller";
import { ParentStudentsService } from "./parent-students.service";

@Module({
  imports: [TypeOrmModule.forFeature([ParentStudent])],
  controllers: [ParentStudentsController],
  providers: [ParentStudentsService],
  exports: [ParentStudentsService],
})
export class ParentStudentsModule {}
