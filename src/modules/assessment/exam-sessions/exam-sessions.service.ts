import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { QuizKind, SortOrder, UserRole } from "../../../common/enums";
import { ExamSession } from "./entities/exam-session.entity";
import { Quiz } from "../../learning/quizzes/entities/quiz.entity";
import { Room } from "../../school/rooms/entities/room.entity";
import { School } from "../../school/schools/entities/school.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class ExamSessionsService extends CrudService<ExamSession> {
  protected readonly options: CrudOptions = {
    label: "Exam session",
    relations: ["school", "quiz", "room", "supervisor"],
    filters: {
      schoolId: "schoolId",
      quizId: "quizId",
      roomId: "roomId",
      supervisorId: "supervisorId",
    },
    sortable: ["id", "startsAt"],
    defaultSort: { property: "startsAt", order: SortOrder.DESC },
    references: {
      schoolId: { entity: () => School, label: "School" },
      quizId: { entity: () => Quiz, label: "Quiz" },
      roomId: { entity: () => Room, label: "Room" },
      supervisorId: {
        entity: () => User,
        label: "Supervisor",
        roles: [UserRole.TEACHER, UserRole.ADMIN],
      },
    },
  };

  constructor(
    @InjectRepository(ExamSession) repository: Repository<ExamSession>,
  ) {
    super(repository);
  }

  /** The quiz of a supervised exam must be a monthly_exam quiz. */
  protected async validateReferences(
    values: Record<string, unknown>,
    user: AuthUser,
  ): Promise<void> {
    await super.validateReferences(values, user);
    const quiz = await this.manager.findOne(Quiz, {
      where: { id: values.quizId as number },
      select: { id: true, kind: true },
    });
    if (quiz && quiz.kind !== QuizKind.MONTHLY_EXAM) {
      throw new BadRequestException(
        `Quiz ${quiz.id} is a ${quiz.kind} quiz; an exam session needs a ${QuizKind.MONTHLY_EXAM} quiz`,
      );
    }
  }
}
