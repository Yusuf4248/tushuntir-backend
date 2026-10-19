import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HomeworkSubmission } from "./entities/homework-submission.entity";
import { HomeworkSubmissionsController } from "./homework-submissions.controller";
import { HomeworkSubmissionsService } from "./homework-submissions.service";

@Module({
  imports: [TypeOrmModule.forFeature([HomeworkSubmission])],
  controllers: [HomeworkSubmissionsController],
  providers: [HomeworkSubmissionsService],
  exports: [HomeworkSubmissionsService],
})
export class HomeworkSubmissionsModule {}
