import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder, UserRole } from "../../../common/enums";
import { AiSession } from "./entities/ai-session.entity";
import { Subject } from "../../school/subjects/entities/subject.entity";
import { Topic } from "../topics/entities/topic.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class AiSessionsService extends CrudService<AiSession> {
  protected readonly options: CrudOptions = {
    label: "AI session",
    relations: ["student", "subject", "topic"],
    filters: {
      studentId: "studentId",
      subjectId: "subjectId",
      topicId: "topicId",
      kind: "kind",
    },
    sortable: ["id", "startedAt"],
    defaultSort: { property: "startedAt", order: SortOrder.DESC },
    references: {
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
      subjectId: { entity: () => Subject, label: "Subject" },
      topicId: { entity: () => Topic, label: "Topic" },
    },
  };

  constructor(@InjectRepository(AiSession) repository: Repository<AiSession>) {
    super(repository);
  }
}
