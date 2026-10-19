import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Homework } from "./entities/homework.entity";
import { Lesson } from "../../daily/lessons/entities/lesson.entity";
import { Quiz } from "../../learning/quizzes/entities/quiz.entity";

@Injectable()
export class HomeworkService extends CrudService<Homework> {
  protected readonly options: CrudOptions = {
    label: "Homework",
    relations: ["lesson", "quiz", "creator"],
    filters: {
      lessonId: "lessonId",
      quizId: "quizId",
      createdBy: "createdBy",
    },
    sortable: ["id", "title", "dueAt"],
    references: {
      lessonId: { entity: () => Lesson, label: "Lesson" },
      quizId: { entity: () => Quiz, label: "Quiz" },
    },
  };

  constructor(@InjectRepository(Homework) repository: Repository<Homework>) {
    super(repository);
  }

  protected async beforeCreate(
    data: Record<string, unknown>,
    user: AuthUser,
  ): Promise<Record<string, unknown>> {
    data.createdBy = user.id;
    return super.beforeCreate(data, user);
  }
}
