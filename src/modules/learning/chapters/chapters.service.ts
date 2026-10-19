import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { Chapter } from "./entities/chapter.entity";
import { Textbook } from "../textbooks/entities/textbook.entity";

@Injectable()
export class ChaptersService extends CrudService<Chapter> {
  protected readonly options: CrudOptions = {
    label: "Chapter",
    relations: ["textbook"],
    filters: {
      textbookId: "textbookId",
    },
    sortable: ["id", "number", "title"],
    defaultSort: { property: "number", order: SortOrder.ASC },
    references: {
      textbookId: { entity: () => Textbook, label: "Textbook" },
    },
  };

  constructor(@InjectRepository(Chapter) repository: Repository<Chapter>) {
    super(repository);
  }
}
