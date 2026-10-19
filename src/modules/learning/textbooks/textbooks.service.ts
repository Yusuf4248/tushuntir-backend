import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Textbook } from "./entities/textbook.entity";
import { Subject } from "../../school/subjects/entities/subject.entity";

@Injectable()
export class TextbooksService extends CrudService<Textbook> {
  protected readonly options: CrudOptions = {
    label: "Textbook",
    relations: ["subject"],
    filters: {
      subjectId: "subjectId",
      grade: "grade",
      language: "language",
    },
    sortable: ["id", "grade", "title", "editionYear"],
    references: {
      subjectId: { entity: () => Subject, label: "Subject" },
    },
  };

  constructor(@InjectRepository(Textbook) repository: Repository<Textbook>) {
    super(repository);
  }
}
