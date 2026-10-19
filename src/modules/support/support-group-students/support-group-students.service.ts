import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { SupportGroupStudent } from "./entities/support-group-student.entity";
import { SupportGroup } from "../support-groups/entities/support-group.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class SupportGroupStudentsService extends CrudService<SupportGroupStudent> {
  protected readonly options: CrudOptions = {
    label: "Support group student",
    relations: ["supportGroup", "student"],
    filters: {
      supportGroupId: "supportGroupId",
      studentId: "studentId",
      attended: "attended",
    },
    sortable: ["id"],
    references: {
      supportGroupId: { entity: () => SupportGroup, label: "Support group" },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
    },
  };

  constructor(
    @InjectRepository(SupportGroupStudent)
    repository: Repository<SupportGroupStudent>,
  ) {
    super(repository);
  }
}
