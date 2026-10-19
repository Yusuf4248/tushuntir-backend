import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { TopicMastery } from "./entities/topic-mastery.entity";
import { Topic } from "../topics/entities/topic.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class TopicMasteryService extends CrudService<TopicMastery> {
  protected readonly options: CrudOptions = {
    label: "Topic mastery record",
    relations: ["student", "topic"],
    filters: {
      studentId: "studentId",
      topicId: "topicId",
      isMastered: "isMastered",
    },
    sortable: ["id", "mastery", "updatedAt"],
    references: {
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
      topicId: { entity: () => Topic, label: "Topic" },
    },
  };

  constructor(
    @InjectRepository(TopicMastery) repository: Repository<TopicMastery>,
  ) {
    super(repository);
  }
}
