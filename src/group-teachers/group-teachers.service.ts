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
import { Group } from "../group/entities/group.entity";
import { Teacher } from "../teacher/entities/teacher.entity";

@Injectable()
export class GroupTeachersService {
  constructor(
    @InjectRepository(GroupTeacher)
    private readonly groupTeacherRepository: Repository<GroupTeacher>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>
  ) {}

  async create(
    createGroupTeacherDto: CreateGroupTeacherDto
  ): Promise<GroupTeacher[]> {
    const { groupId, teacherId, status, start_date } = createGroupTeacherDto;

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException("Group not found");

    const results: GroupTeacher[] = [];

    for (const id of teacherId) {
      const teacher = await this.teacherRepository.findOne({ where: { id } });
      if (!teacher)
        throw new NotFoundException(`Teacher with ID ${id} not found`);

      const existingRelation = await this.groupTeacherRepository.findOne({
        where: { group: { id: groupId }, teacher: { id } },
      });

      if (existingRelation) {
        throw new BadRequestException(
          `Teacher with ID ${id} is already assigned to this group`
        );
      }

      const newRelation = this.groupTeacherRepository.create({
        group,
        teacher,
        status: status ?? true,
        start_date: start_date ?? group.start_date,
        end_date: group.end_date,
      });

      const saved = await this.groupTeacherRepository.save(newRelation);
      results.push(saved);
    }

    return results;
  }

  findAll(): Promise<GroupTeacher[]> {
    return this.groupTeacherRepository.find({
      relations: ["group", "teacher"],
      order: {
        id: "ASC",
      },
    });
  }

  async findOne(id: number): Promise<GroupTeacher> {
    const groupTeacher = await this.groupTeacherRepository.findOne({
      where: { id },
      relations: ["group", "teacher"],
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

    if (updateDto.groupId) {
      const group = await this.groupRepository.findOneBy({
        id: updateDto.groupId,
      });
      if (!group) throw new NotFoundException("Group not found");
      groupTeacher.group = group;
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

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.groupTeacherRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("GroupTeacher not found");
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

  async findActiveTeachersInGroup(groupId: number): Promise<GroupTeacher[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    return await this.groupTeacherRepository.find({
      where: {
        group: { id: groupId },
        status: true,
      },
      relations: ["teacher"],
      order: { id: "ASC" },
    });
  }

  async findByGroup(groupId: number): Promise<GroupTeacher[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const groupTeachers = await this.groupTeacherRepository.find({
      where: { group: { id: groupId } },
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
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    return await this.groupTeacherRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ["group"],
      order: { id: "ASC" },
    });
  }
}
