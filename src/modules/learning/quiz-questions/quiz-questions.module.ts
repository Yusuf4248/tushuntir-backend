import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { QuizQuestionsController } from "./quiz-questions.controller";
import { QuizQuestionsService } from "./quiz-questions.service";

@Module({
  imports: [TypeOrmModule.forFeature([QuizQuestion])],
  controllers: [QuizQuestionsController],
  providers: [QuizQuestionsService],
  exports: [QuizQuestionsService],
})
export class QuizQuestionsModule {}
