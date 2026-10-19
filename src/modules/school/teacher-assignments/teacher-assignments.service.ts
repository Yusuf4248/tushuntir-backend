import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { TeacherAssignment } from "./entities/teacher-assignment.entity";
import { SchoolClass } from "../classes/entities/school-class.entity";
import { Subject } from "../subjects/entities/subject.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class TeacherAssignmentsService extends CrudService<TeacherAssignment> {
  protected readonly options: CrudOptions = {
    label: "Teacher assignment",
    relations: ["teacher", "schoolClass", "subject"],
    filters: {
      teacherId: "teacherId",
      classId: "classId",
      subjectId: "subjectId",
    },
    sortable: ["id"],
    references: {
      teacherId: {
        entity: () => User,
        label: "Teacher",
        roles: [UserRole.TEACHER],
      },
      classId: { entity: () => SchoolClass, label: "Class" },
      subjectId: { entity: () => Subject, label: "Subject" },
    },
  };

  constructor(
    @InjectRepository(TeacherAssignment)
    repository: Repository<TeacherAssignment>,
  ) {
    super(repository);
  }
}
