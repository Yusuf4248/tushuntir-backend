import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { QueryFailedError, Repository } from "typeorm";
import { SubjectsService } from "../modules/school/subjects/subjects.service";
import { LessonsService } from "../lessons/lessons.service";
import { GroupStudentsService } from "../group-students/group-students.service";
import { GroupTeachersService } from "../group-teachers/group-teachers.service";
import { AttendanceService } from "../attendance/attendance.service";

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @Inject(forwardRef(() => LessonsService))
    private readonly lessonService: LessonsService,
    private readonly subjectService: SubjectsService,
    private readonly attendanceService: AttendanceService,
    @Inject(forwardRef(() => GroupStudentsService))
    private readonly groupStudentsService: GroupStudentsService,
    @Inject(forwardRef(() => GroupTeachersService))
    private readonly groupTeachersService: GroupTeachersService
  ) {}
  async create(createGroupDto: CreateGroupDto) {
    const { subject } = await this.subjectService.findOne(
      createGroupDto.subjectId
    );

    try {
      const newGroup = await this.groupRepo.save({
        ...createGroupDto,
        subject,
      });

      const lessons = await this.lessonService.createAllLessons({
        roomId: newGroup.roomId,
        groupId: newGroup.id,
      });

      const newGroup1 = await this.groupRepo.findOne({
        where: { id: newGroup.id },
        relations: ["subject"],
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
      throw new InternalServerErrorException(
        "Unexpected error during group creation"
      );
    }
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [groups, total] = await this.groupRepo.findAndCount({
      relations: ["subject", "lessons.room"],
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
      relations: ["subject", "lessons", "groupTeachers", "groupStudents"],
    });
    if (!group) {
      throw new NotFoundException(`Group ID-${id} not found`);
    }
    const room = group.lessons[0].room;
    return {
      message: `Group ID-${id}`,
      success: true,
      group,
      room,
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
      relations: ["students", "teachers", "subject"],
    });
    if (!group) {
      throw new NotFoundException(
        `${group_name} group not found. Plese check group name and try again.`
      );
    }
    return group;
  }

  async findOneGroupForTeacher(id: number) {
    const group = await this.findOne(id);
    await this.lessonService.completeExpiredLessons();
    const groupTeachers = await this.groupTeachersService.findByGroup(id);
    const groupStudents = await this.groupStudentsService.findByGroup(id);
    const { lessons } = await this.lessonService.findGroupAllLessons(id);
    const newDate = new Date();
    const data = await this.attendanceService.isLessonAttendedByDate(
      id,
      newDate
    );

    return {
      message: `${id}-group`,
      group: group.group,
      room: group.room,
      groupTeachers,
      groupStudents,
      lessons,
      data,
    };
  }
}
