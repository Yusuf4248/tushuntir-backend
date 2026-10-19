import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { AttemptMode, SortOrder, UserRole } from "../../../common/enums";
import { Attempt } from "./entities/attempt.entity";
import { ExamSession } from "../../assessment/exam-sessions/entities/exam-session.entity";
import { Quiz } from "../quizzes/entities/quiz.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class AttemptsService extends CrudService<Attempt> {
  protected readonly options: CrudOptions = {
    label: "Attempt",
    relations: ["quiz", "student", "examSession"],
    filters: {
      quizId: "quizId",
      studentId: "studentId",
      examSessionId: "examSessionId",
      mode: "mode",
    },
    sortable: ["id", "scorePercent", "startedAt", "finishedAt"],
    defaultSort: { property: "startedAt", order: SortOrder.DESC },
    references: {
      quizId: { entity: () => Quiz, label: "Quiz" },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
      examSessionId: { entity: () => ExamSession, label: "Exam session" },
    },
  };

  constructor(@InjectRepository(Attempt) repository: Repository<Attempt>) {
    super(repository);
  }

  /**
   * mode exam needs an exam session running this attempt's quiz;
   * mode home must not have an exam session.
   */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    if (values.mode === AttemptMode.EXAM && values.examSessionId == null) {
      throw new BadRequestException("An exam attempt needs an examSessionId");
    }
    if (values.mode === AttemptMode.HOME && values.examSessionId != null) {
      throw new BadRequestException(
        "A home attempt must not have an examSessionId",
      );
    }
    await super.validateReferences(values, user);
    if (values.examSessionId != null) {
      const session = await this.manager.findOne(ExamSession, {
        where: { id: values.examSessionId as number },
        select: { id: true, quizId: true },
      });
      if (session && session.quizId !== values.quizId) {
        throw new BadRequestException(
          `Exam session ${session.id} runs quiz ${session.quizId}, not quiz ${values.quizId}`,
        );
      }
    }
  }
}
