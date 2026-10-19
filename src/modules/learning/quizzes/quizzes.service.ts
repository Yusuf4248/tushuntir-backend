import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Quiz } from "./entities/quiz.entity";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { Question } from "../questions/entities/question.entity";
import { QuizQuestion } from "../quiz-questions/entities/quiz-question.entity";
import { Topic } from "../topics/entities/topic.entity";
import { ReplaceQuizQuestionsDto } from "./dto/replace-quiz-questions.dto";

@Injectable()
export class QuizzesService extends CrudService<Quiz> {
  protected readonly options: CrudOptions = {
    label: "Quiz",
    relations: ["topic", "schoolClass", "creator"],
    filters: {
      topicId: "topicId",
      classId: "classId",
      createdBy: "createdBy",
      kind: "kind",
    },
    sortable: ["id", "title", "createdAt"],
    references: {
      topicId: { entity: () => Topic, label: "Topic" },
      classId: { entity: () => SchoolClass, label: "Class" },
    },
  };

  constructor(@InjectRepository(Quiz) repository: Repository<Quiz>) {
    super(repository);
  }

  /** Replaces the quiz's questions with the given ordered list, in one transaction. */
  async replaceQuestions(
    id: number,
    dto: ReplaceQuizQuestionsDto,
    user: AuthUser,
  ): Promise<QuizQuestion[]> {
    this.assertCanWrite(user);
    await this.findOne(id, user);
    const questionIds = dto.questions.map((item) => item.questionId);
    const duplicate = questionIds.find(
      (qid, index) => questionIds.indexOf(qid) !== index,
    );
    if (duplicate) {
      throw new BadRequestException(
        `Question ${duplicate} appears more than once`,
      );
    }
    if (questionIds.length) {
      const found = await this.manager.find(Question, {
        where: { id: In(questionIds) },
        select: { id: true },
      });
      const existing = new Set(found.map((question) => question.id));
      const missing = questionIds.filter((qid) => !existing.has(qid));
      if (missing.length) {
        throw new NotFoundException(`Question ${missing.join(", ")} not found`);
      }
    }
    await this.manager.transaction(async (tx) => {
      await tx.delete(QuizQuestion, { quizId: id });
      if (questionIds.length) {
        await tx.insert(
          QuizQuestion,
          dto.questions.map((item, index) => ({
            quizId: id,
            questionId: item.questionId,
            position: index + 1,
            points: item.points ?? 1,
          })),
        );
      }
    });
    return this.manager.find(QuizQuestion, {
      where: { quizId: id },
      relations: { question: true },
      order: { position: "ASC" },
    });
  }

  protected async beforeCreate(
    data: Record<string, unknown>,
    user: AuthUser,
  ): Promise<Record<string, unknown>> {
    data.createdBy = user.id;
    return super.beforeCreate(data, user);
  }
}
