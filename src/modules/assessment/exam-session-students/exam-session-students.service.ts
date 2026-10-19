import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { ExamSessionStudent } from "./entities/exam-session-student.entity";
import { ExamSession } from "../exam-sessions/entities/exam-session.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class ExamSessionStudentsService extends CrudService<ExamSessionStudent> {
  protected readonly options: CrudOptions = {
    label: "Exam session student",
    relations: ["examSession", "student"],
    filters: {
      examSessionId: "examSessionId",
      studentId: "studentId",
      status: "status",
    },
    sortable: ["id"],
    references: {
      examSessionId: { entity: () => ExamSession, label: "Exam session" },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
    },
  };

  constructor(
    @InjectRepository(ExamSessionStudent)
    repository: Repository<ExamSessionStudent>,
  ) {
    super(repository);
  }
}
