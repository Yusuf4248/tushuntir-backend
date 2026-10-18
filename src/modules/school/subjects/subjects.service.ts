import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Subject } from "./entities/subject.entity";
import { Repository } from "typeorm";

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject) private readonly subjectRepo: Repository<Subject>
  ) {}
  async create(createSubjectDto: CreateSubjectDto) {
    const newSubject = await this.subjectRepo.save(createSubjectDto);
    return {
      message: "New subject created!",
      success: true,
      newSubject,
    };
  }

  async findAll() {
    const subjects = await this.subjectRepo.find({
      relations: ["groups"],
      order: {
        id: "ASC",
      },
    });
    return {
      success: true,
      message: "Subjects:",
      subjects,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(id) || Number(id) <= 0) {
      throw new BadRequestException("ID must be integer and greater than zero");
    }
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ["groups"],
      order: {
        id: "ASC",
      },
    });
    if (!subject) {
      throw new NotFoundException(`${id}-subject not found`);
    }
    return {
      success: true,
      subject,
    };
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    await this.findOne(id);
    await this.subjectRepo.update({ id }, updateSubjectDto);

    const subject = await this.findOne(id);
    return {
      message: "Subject data updated!",
      success: true,
      subject,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.subjectRepo.delete({ id });
    return {
      message: `${id}-id subject deleted`,
      success: true,
    };
  }
}
