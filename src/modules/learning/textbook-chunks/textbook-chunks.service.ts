import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { TextbookChunk } from "./entities/textbook-chunk.entity";
import { Topic } from "../topics/entities/topic.entity";

@Injectable()
export class TextbookChunksService extends CrudService<TextbookChunk> {
  protected readonly options: CrudOptions = {
    label: "Textbook chunk",
    relations: ["topic"],
    filters: {
      topicId: "topicId",
    },
    sortable: ["id", "page"],
    references: {
      topicId: { entity: () => Topic, label: "Topic" },
    },
  };

  constructor(
    @InjectRepository(TextbookChunk) repository: Repository<TextbookChunk>,
  ) {
    super(repository);
  }
}
