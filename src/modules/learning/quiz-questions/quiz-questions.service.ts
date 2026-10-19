import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { Question } from "../questions/entities/question.entity";
import { Quiz } from "../quizzes/entities/quiz.entity";

@Injectable()
export class QuizQuestionsService extends CrudService<QuizQuestion> {
  protected readonly options: CrudOptions = {
    label: "Quiz question",
    relations: ["quiz", "question"],
    filters: {
      quizId: "quizId",
      questionId: "questionId",
    },
    sortable: ["id", "position"],
    defaultSort: { property: "position", order: SortOrder.ASC },
    references: {
      quizId: { entity: () => Quiz, label: "Quiz" },
      questionId: { entity: () => Question, label: "Question" },
    },
  };

  constructor(
    @InjectRepository(QuizQuestion) repository: Repository<QuizQuestion>,
  ) {
    super(repository);
  }
}
