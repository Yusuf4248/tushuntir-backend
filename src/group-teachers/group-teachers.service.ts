import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupTeacher } from "./entities/group-teacher.entity";
import { CreateGroupTeacherDto } from "./dto/create-group-teacher.dto";
import { UpdateGroupTeacherDto } from "./dto/update-group-teacher.dto";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { Teacher } from "../teacher/entities/teacher.entity";

@Injectable()
export class GroupTeachersService {
  constructor(
    @InjectRepository(GroupTeacher)
    private readonly groupTeacherRepository: Repository<GroupTeacher>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>
  ) {}

  async create(
    createGroupTeacherDto: CreateGroupTeacherDto
  ): Promise<GroupTeacher[]> {
    const { classId, teacherId, status, start_date } = createGroupTeacherDto;

    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) throw new NotFoundException("Class not found");

    const results: GroupTeacher[] = [];

    for (const id of teacherId) {
      const teacher = await this.teacherRepository.findOne({ where: { id } });
      if (!teacher)
        throw new NotFoundException(`Teacher with ID ${id} not found`);

      const existingRelation = await this.groupTeacherRepository.findOne({
        where: { schoolClass: { id: classId }, teacher: { id } },
      });

      if (existingRelation) {
        throw new BadRequestException(
          `Teacher with ID ${id} is already assigned to this class`
        );
      }

      const newRelation = this.groupTeacherRepository.create({
        schoolClass,
        teacher,
        status: status ?? true,
        start_date: start_date ?? schoolClass.start_date,
        end_date: schoolClass.end_date,
      });

      const saved = await this.groupTeacherRepository.save(newRelation);
      results.push(saved);
    }

    return results;
  }

  findAll(): Promise<GroupTeacher[]> {
    return this.groupTeacherRepository.find({
      relations: ["schoolClass", "teacher"],
      order: {
        id: "ASC",
      },
    });
  }

  async findOne(id: number): Promise<GroupTeacher> {
    const groupTeacher = await this.groupTeacherRepository.findOne({
      where: { id },
      relations: ["schoolClass", "teacher"],
      order: {
        id: "ASC",
      },
    });
    if (!groupTeacher) throw new NotFoundException("GroupTeacher not found");
    return groupTeacher;
  }

  async update(
    id: number,
    updateDto: UpdateGroupTeacherDto
  ): Promise<GroupTeacher> {
    const groupTeacher = await this.groupTeacherRepository.findOneBy({ id });
    if (!groupTeacher) throw new NotFoundException("GroupTeacher not found");

    if (updateDto.classId) {
      const schoolClass = await this.classRepository.findOneBy({
        id: updateDto.classId,
      });
      if (!schoolClass) throw new NotFoundException("Class not found");
      groupTeacher.schoolClass = schoolClass;
    }

    if (updateDto.teacherId) {
      const teacher = await this.teacherRepository.findOneBy({
        id: updateDto.teacherId,
      });
      if (!teacher) throw new NotFoundException("Teacher not found");
      groupTeacher.teacher = teacher;
    }

    return this.groupTeacherRepository.save(groupTeacher);
  }

  async remove(
    classId: number,
    teacherId: number
  ): Promise<{ message: string }> {
    const result = await this.groupTeacherRepository.delete({
      schoolClass: { id: classId },
      teacher: { id: teacherId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `GroupTeacher with classId=${classId} and teacherId=${teacherId} not found`
      );
    }

    return { message: "GroupTeacher deleted successfully" };
  }

  async deactivateTeacher(id: number): Promise<GroupTeacher> {
    const groupTeacher = await this.findOne(id);
    groupTeacher.status = false;
    return await this.groupTeacherRepository.save(groupTeacher);
  }

  async activateTeacher(id: number): Promise<GroupTeacher> {
    const groupTeacher = await this.findOne(id);
    groupTeacher.status = true;
    return await this.groupTeacherRepository.save(groupTeacher);
  }

  async findActiveTeachersInClass(classId: number): Promise<GroupTeacher[]> {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    return await this.groupTeacherRepository.find({
      where: {
        schoolClass: { id: classId },
        status: true,
      },
      relations: ["teacher"],
      order: { id: "ASC" },
    });
  }

  async findByClass(classId: number): Promise<GroupTeacher[]> {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const groupTeachers = await this.groupTeacherRepository.find({
      where: { schoolClass: { id: classId } },
      relations: ["teacher"],
      order: { id: "ASC" },
    });
    return groupTeachers;
  }

  async findByTeacher(teacherId: number): Promise<GroupTeacher[]> {
    const teacher = await this.groupTeacherRepository.findOne({
      where: { teacher: { id: teacherId } },
    });
    if (!teacher) {
      throw new NotFoundException(`${teacherId}-teacher has no class`);
    }

    return await this.groupTeacherRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ["schoolClass"],
      order: { id: "ASC" },
    });
  }
}
