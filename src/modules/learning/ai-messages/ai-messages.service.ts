import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { AiMessage } from "./entities/ai-message.entity";
import { AiSession } from "../ai-sessions/entities/ai-session.entity";

@Injectable()
export class AiMessagesService extends CrudService<AiMessage> {
  protected readonly options: CrudOptions = {
    label: "AI message",
    relations: ["session"],
    filters: {
      sessionId: "sessionId",
      role: "role",
    },
    sortable: ["id", "createdAt"],
    references: {
      sessionId: { entity: () => AiSession, label: "AI session" },
    },
  };

  constructor(@InjectRepository(AiMessage) repository: Repository<AiMessage>) {
    super(repository);
  }
}
