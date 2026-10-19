import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttemptAnswer } from "./entities/attempt-answer.entity";
import { AttemptAnswersController } from "./attempt-answers.controller";
import { AttemptAnswersService } from "./attempt-answers.service";

@Module({
  imports: [TypeOrmModule.forFeature([AttemptAnswer])],
  controllers: [AttemptAnswersController],
  providers: [AttemptAnswersService],
  exports: [AttemptAnswersService],
})
export class AttemptAnswersModule {}
