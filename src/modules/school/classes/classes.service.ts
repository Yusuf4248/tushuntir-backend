import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { SchoolClass } from "./entities/school-class.entity";
import { AcademicYear } from "../academic-years/entities/academic-year.entity";
import { School } from "../schools/entities/school.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class ClassesService extends CrudService<SchoolClass> {
  protected readonly options: CrudOptions = {
    label: "Class",
    relations: ["school", "academicYear", "homeroomTeacher"],
    filters: {
      schoolId: "schoolId",
      academicYearId: "academicYearId",
      homeroomTeacherId: "homeroomTeacherId",
      grade: "grade",
      shift: "shift",
    },
    sortable: ["id", "grade", "letter"],
    references: {
      schoolId: { entity: () => School, label: "School" },
      academicYearId: { entity: () => AcademicYear, label: "Academic year" },
      homeroomTeacherId: {
        entity: () => User,
        label: "Homeroom teacher",
        roles: [UserRole.TEACHER],
      },
    },
  };

  constructor(
    @InjectRepository(SchoolClass) repository: Repository<SchoolClass>,
  ) {
    super(repository);
  }
}
