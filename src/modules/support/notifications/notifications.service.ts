import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { SortOrder } from "../../../common/enums";
import { Notification } from "./entities/notification.entity";
import { User } from "../../identity/users/entities/user.entity";

@Injectable()
export class NotificationsService extends CrudService<Notification> {
  protected readonly options: CrudOptions = {
    label: "Notification",
    relations: ["user"],
    filters: {
      userId: "userId",
      type: "type",
    },
    sortable: ["id", "readAt", "createdAt"],
    defaultSort: { property: "createdAt", order: SortOrder.DESC },
    references: {
      userId: { entity: () => User, label: "User" },
    },
  };

  constructor(
    @InjectRepository(Notification) repository: Repository<Notification>,
  ) {
    super(repository);
  }
}
