import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { AttemptAnswer } from "./entities/attempt-answer.entity";
import { Attempt } from "../attempts/entities/attempt.entity";
import { Question } from "../questions/entities/question.entity";
import { QuizQuestion } from "../quiz-questions/entities/quiz-question.entity";

@Injectable()
export class AttemptAnswersService extends CrudService<AttemptAnswer> {
  protected readonly options: CrudOptions = {
    label: "Attempt answer",
    relations: ["attempt", "question"],
    filters: {
      attemptId: "attemptId",
      questionId: "questionId",
      isCorrect: "isCorrect",
    },
    sortable: ["id"],
    references: {
      attemptId: { entity: () => Attempt, label: "Attempt" },
      questionId: { entity: () => Question, label: "Question" },
    },
  };

  constructor(
    @InjectRepository(AttemptAnswer) repository: Repository<AttemptAnswer>,
  ) {
    super(repository);
  }

  /** The answered question must be part of the attempt's quiz. */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    await super.validateReferences(values, user);
    const attempt = await this.manager.findOne(Attempt, {
      where: { id: values.attemptId as number },
      select: { id: true, quizId: true },
    });
    if (!attempt) return;
    const inQuiz = await this.manager.exists(QuizQuestion, {
      where: {
        quizId: attempt.quizId,
        questionId: values.questionId as number,
      },
    });
    if (!inQuiz) {
      throw new BadRequestException(
        `Question ${values.questionId} is not part of quiz ${attempt.quizId} (attempt ${attempt.id})`,
      );
    }
  }
}
