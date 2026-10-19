import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { Subject } from "./entities/subject.entity";

@Injectable()
export class SubjectsService extends CrudService<Subject> {
  protected readonly options: CrudOptions = {
    label: "Subject",
    sortable: ["id", "name", "code"],
  };

  constructor(@InjectRepository(Subject) repository: Repository<Subject>) {
    super(repository);
  }
}
