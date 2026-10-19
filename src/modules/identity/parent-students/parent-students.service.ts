import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { ParentStudent } from "./entities/parent-student.entity";
import { User } from "../users/entities/user.entity";

@Injectable()
export class ParentStudentsService extends CrudService<ParentStudent> {
  protected readonly options: CrudOptions = {
    label: "Parent link",
    relations: ["parent", "student"],
    filters: {
      parentId: "parentId",
      studentId: "studentId",
      relation: "relation",
    },
    sortable: ["id"],
    references: {
      parentId: {
        entity: () => User,
        label: "Parent",
        roles: [UserRole.PARENT],
      },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
    },
  };

  constructor(
    @InjectRepository(ParentStudent) repository: Repository<ParentStudent>,
  ) {
    super(repository);
  }
}
