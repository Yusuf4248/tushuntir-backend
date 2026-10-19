import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder, UserRole } from "../../../common/enums";
import { SupportGroup } from "./entities/support-group.entity";
import { Room } from "../../school/rooms/entities/room.entity";
import { School } from "../../school/schools/entities/school.entity";
import { Topic } from "../../learning/topics/entities/topic.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class SupportGroupsService extends CrudService<SupportGroup> {
  protected readonly options: CrudOptions = {
    label: "Support group",
    relations: ["school", "topic", "teacher", "room"],
    filters: {
      schoolId: "schoolId",
      topicId: "topicId",
      teacherId: "teacherId",
      roomId: "roomId",
      status: "status",
    },
    sortable: ["id", "scheduledAt"],
    defaultSort: { property: "scheduledAt", order: SortOrder.DESC },
    references: {
      schoolId: { entity: () => School, label: "School" },
      topicId: { entity: () => Topic, label: "Topic" },
      teacherId: {
        entity: () => User,
        label: "Teacher",
        roles: [UserRole.TEACHER],
      },
      roomId: { entity: () => Room, label: "Room" },
    },
  };

  constructor(
    @InjectRepository(SupportGroup) repository: Repository<SupportGroup>,
  ) {
    super(repository);
  }
}
