import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Room } from "./entities/room.entity";
import { School } from "../schools/entities/school.entity";

@Injectable()
export class RoomsService extends CrudService<Room> {
  protected readonly options: CrudOptions = {
    label: "Room",
    relations: ["school"],
    filters: {
      schoolId: "schoolId",
      type: "type",
    },
    sortable: ["id", "name", "seats"],
    references: {
      schoolId: { entity: () => School, label: "School" },
    },
  };

  constructor(@InjectRepository(Room) repository: Repository<Room>) {
    super(repository);
  }
}
