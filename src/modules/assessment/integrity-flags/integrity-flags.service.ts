import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { FlagStatus, UserRole } from "../../../common/enums";
import { IntegrityFlag } from "./entities/integrity-flag.entity";
import { ExamSession } from "../exam-sessions/entities/exam-session.entity";
import { Topic } from "../../learning/topics/entities/topic.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class IntegrityFlagsService extends CrudService<IntegrityFlag> {
  protected readonly options: CrudOptions = {
    label: "Integrity flag",
    relations: ["student", "topic", "examSession", "reviewer"],
    filters: {
      studentId: "studentId",
      topicId: "topicId",
      examSessionId: "examSessionId",
      reviewedBy: "reviewedBy",
      status: "status",
    },
    sortable: ["id", "gap", "createdAt"],
    references: {
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
      topicId: { entity: () => Topic, label: "Topic" },
      examSessionId: { entity: () => ExamSession, label: "Exam session" },
    },
  };

  constructor(
    @InjectRepository(IntegrityFlag) repository: Repository<IntegrityFlag>,
  ) {
    super(repository);
  }

  /** Moving a flag to reviewed or dismissed records who reviewed it. */
  protected async beforeUpdate(
    data: Record<string, unknown>,
    existing: IntegrityFlag,
    user: AuthUser,
  ): Promise<Record<string, unknown>> {
    if (
      data.status !== undefined &&
      data.status !== existing.status &&
      data.status !== FlagStatus.OPEN
    ) {
      data.reviewedBy = user.id;
    }
    return super.beforeUpdate(data, existing, user);
  }
}
