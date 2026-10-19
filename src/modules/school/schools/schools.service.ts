import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { School } from "./entities/school.entity";

@Injectable()
export class SchoolsService extends CrudService<School> {
  protected readonly options: CrudOptions = {
    label: "School",
    filters: {
      region: "region",
      district: "district",
      type: "type",
    },
    sortable: ["id", "name", "region", "district", "createdAt"],
  };

  constructor(@InjectRepository(School) repository: Repository<School>) {
    super(repository);
  }
}
