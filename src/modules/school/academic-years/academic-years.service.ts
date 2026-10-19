import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { AcademicYear } from "./entities/academic-year.entity";
import { School } from "../schools/entities/school.entity";

@Injectable()
export class AcademicYearsService extends CrudService<AcademicYear> {
  protected readonly options: CrudOptions = {
    label: "Academic year",
    relations: ["school"],
    filters: {
      schoolId: "schoolId",
      isCurrent: "isCurrent",
    },
    sortable: ["id", "name", "startsOn"],
    defaultSort: { property: "startsOn", order: SortOrder.DESC },
    references: {
      schoolId: { entity: () => School, label: "School" },
    },
  };

  constructor(
    @InjectRepository(AcademicYear) repository: Repository<AcademicYear>,
  ) {
    super(repository);
  }
}
