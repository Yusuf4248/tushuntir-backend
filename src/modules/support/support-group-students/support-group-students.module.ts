import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SupportGroupStudent } from "./entities/support-group-student.entity";
import { SupportGroupStudentsController } from "./support-group-students.controller";
import { SupportGroupStudentsService } from "./support-group-students.service";

@Module({
  imports: [TypeOrmModule.forFeature([SupportGroupStudent])],
  controllers: [SupportGroupStudentsController],
  providers: [SupportGroupStudentsService],
  exports: [SupportGroupStudentsService],
})
export class SupportGroupStudentsModule {}
