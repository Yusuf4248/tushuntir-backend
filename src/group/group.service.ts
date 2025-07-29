import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { QueryFailedError, Repository } from "typeorm";
import { CoursesService } from "../courses/courses.service";
import { LessonsService } from "../lessons/lessons.service";
import { Lesson, LessonStatus } from "../lessons/entities/lesson.entity";

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    private readonly lessonService: LessonsService,
    private readonly courseService: CoursesService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>
  ) {}
  async create(createGroupDto: CreateGroupDto) {
    const { course } = await this.courseService.findOne(
      createGroupDto.courseId
    );

    try {
      const newGroup = await this.groupRepo.save({
        ...createGroupDto,
        course,
      });

      const lessons = await this.lessonService.createAllLessons({
        roomId: newGroup.roomId,
        groupId: newGroup.id,
      });

      const newGroup1 = await this.groupRepo.findOne({
        where: { id: newGroup.id },
        relations: ["course"],
      });

      return {
        message: "New group created successfully!",
        success: true,
        newGroup: newGroup1,
        lessons,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === "23505"
      ) {
        throw new ConflictException("Group name already exists");
      }
      console.log(error);
      throw new InternalServerErrorException(
        "Unexpected error during group creation"
      );
    }
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [groups, total] = await this.groupRepo.findAndCount({
      relations: ["course", "lessons.room"],
      skip,
      take: limit,
      order: { id: "ASC" },
    });
    return {
      success: true,
      total,
      page,
      limit,
      data: groups,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ["course", "lessons.room"],
    });
    if (!group) {
      throw new NotFoundException(`Group ID-${id} not found`);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lesson = await this.lessonRepo.findOne({
      where: {
        date: today,
        group: { id },
      },
      relations: ["room"],
    });
    if (!lesson) {
      throw new NotFoundException(`No lessons found for Group ID-${id}`);
    }

    if (lesson.status !== LessonStatus.NEW) {
      throw new BadRequestException("Attendance for this lesson was recorded.");
    }
    const room = lesson.room;
    const isAttended = lesson.status !== LessonStatus.NEW;
    return {
      message: `Group ID-${id}`,
      success: true,
      group,
      room,
      isAttended,
    };
  }

  async update(id: number, updateGroupDto: UpdateGroupDto) {
    await this.findOne(id);
    await this.groupRepo.update({ id }, updateGroupDto);

    const group = await this.findOne(id);
    return {
      message: `Group ID-${id} data updated`,
      success: true,
      group,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.groupRepo.delete({ id });
    return {
      message: `Group id-${id} deleted`,
      success: true,
    };
  }

  async getGroupByName(group_name: string) {
    if (!group_name?.trim()) {
      throw new BadRequestException("Guruh nomi bo'sh bo'lishi mumkin emas");
    }
    const group = await this.groupRepo.findOne({
      where: { name: group_name },
      relations: ["students", "teachers", "course"],
    });
    if (!group) {
      throw new NotFoundException(
        `${group_name} group not found. Plese check group name and try again.`
      );
    }
    return group;
  }
}
