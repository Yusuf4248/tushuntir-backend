import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { Term } from "./entities/term.entity";
import { AcademicYear } from "../academic-years/entities/academic-year.entity";

@Injectable()
export class TermsService extends CrudService<Term> {
  protected readonly options: CrudOptions = {
    label: "Term",
    relations: ["academicYear"],
    filters: {
      academicYearId: "academicYearId",
    },
    sortable: ["id", "name", "startsOn"],
    defaultSort: { property: "startsOn", order: SortOrder.ASC },
    references: {
      academicYearId: { entity: () => AcademicYear, label: "Academic year" },
    },
  };

  constructor(@InjectRepository(Term) repository: Repository<Term>) {
    super(repository);
  }
}
