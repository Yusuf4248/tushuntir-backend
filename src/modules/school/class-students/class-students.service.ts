import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { ClassStudent } from "./entities/class-student.entity";
import { SchoolClass } from "../classes/entities/school-class.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class ClassStudentsService extends CrudService<ClassStudent> {
  protected readonly options: CrudOptions = {
    label: "Class enrolment",
    relations: ["schoolClass", "student"],
    filters: {
      classId: "classId",
      studentId: "studentId",
    },
    sortable: ["id", "joinedOn"],
    references: {
      classId: { entity: () => SchoolClass, label: "Class" },
      studentId: {
        entity: () => User,
        label: "Student",
        roles: [UserRole.STUDENT],
      },
    },
  };

  constructor(
    @InjectRepository(ClassStudent) repository: Repository<ClassStudent>,
  ) {
    super(repository);
  }
}
