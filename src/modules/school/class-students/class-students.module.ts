import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClassStudent } from "./entities/class-student.entity";
import { ClassStudentsController } from "./class-students.controller";
import { ClassStudentsService } from "./class-students.service";

@Module({
  imports: [TypeOrmModule.forFeature([ClassStudent])],
  controllers: [ClassStudentsController],
  providers: [ClassStudentsService],
  exports: [ClassStudentsService],
})
export class ClassStudentsModule {}
