import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { Topic } from "./entities/topic.entity";
import { Chapter } from "../chapters/entities/chapter.entity";

@Injectable()
export class TopicsService extends CrudService<Topic> {
  protected readonly options: CrudOptions = {
    label: "Topic",
    relations: ["chapter"],
    filters: {
      chapterId: "chapterId",
      isExamTopic: "isExamTopic",
    },
    sortable: ["id", "position", "title"],
    defaultSort: { property: "position", order: SortOrder.ASC },
    references: {
      chapterId: { entity: () => Chapter, label: "Chapter" },
    },
  };

  constructor(@InjectRepository(Topic) repository: Repository<Topic>) {
    super(repository);
  }
}
