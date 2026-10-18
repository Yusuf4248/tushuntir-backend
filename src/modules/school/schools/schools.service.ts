import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateSchoolDto } from "./dto/create-school.dto";
import { UpdateSchoolDto } from "./dto/update-school.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { School } from "./entities/school.entity";
import { In, Repository } from "typeorm";
import { Teacher } from "../../identity/teacher/entities/teacher.entity";

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School) private readonly schoolRepo: Repository<School>
  ) {}
  async create(createSchoolDto: CreateSchoolDto) {
    const newSchool = await this.schoolRepo.save({
      ...createSchoolDto,
    });

    return {
      message: "New school created",
      success: true,
      newSchool,
    };
  }

  async findAll() {
    const school = await this.schoolRepo.find({
      relations: ["teachers"],
    });
    return {
      message: "All schools",
      success: true,
      school,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    }
    const school = await this.schoolRepo.findOne({
      where: { id },
      relations: ["teachers"],
    });
    if (!school) {
      throw new NotFoundException(`${id}-school not found`);
    }
    return {
      message: `${id}-school`,
      succes: true,
      school,
    };
  }

  async update(id: number, updateSchoolDto: UpdateSchoolDto) {
    await this.findOne(id);
    await this.schoolRepo.update({ id }, updateSchoolDto);

    const school = await this.findOne(id);
    return {
      message: `${id}-school data updated!`,
      success: true,
      school: school.school,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.schoolRepo.delete(id);
    return {
      message: `${id}-school deleted`,
      success: true,
    };
  }
}
