import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CreateGroupStudentDto } from "./dto/create-group-student.dto";
import { UpdateGroupStudentDto } from "./dto/update-group-student.dto";
import { GroupStudent } from "./entities/group-student.entity";
import { Group } from "../group/entities/group.entity";
import { Student } from "../student/entities/student.entities";
import { AttendanceService } from "../attendance/attendance.service";
import { Attendance } from "../attendance/entities/attendance.entity";
import { LessonsService } from "../lessons/lessons.service";
import { Lesson, LessonStatus } from "../lessons/entities/lesson.entity";

@Injectable()
export class GroupStudentsService {
  constructor(
    @InjectRepository(GroupStudent)
    private readonly groupStudentRepository: Repository<GroupStudent>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @Inject(forwardRef(() => AttendanceService))
    private attendanceService: AttendanceService,
    private readonly lessonService: LessonsService,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>
  ) {}

  async create(createGroupStudentDto: CreateGroupStudentDto) {
    const { groupId, studentId, status = true } = createGroupStudentDto;

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const students = await this.studentRepository.find({
      where: { id: In(studentId) },
    });

    if (students.length !== studentId.length) {
      throw new NotFoundException(`Some students not found`);
    }

    const result: {
      groupStudent: GroupStudent;
      attendances: Attendance[];
    }[] = [];

    const groupStudentsToSave: GroupStudent[] = [];

    for (const student of students) {
      const existingRelation = await this.groupStudentRepository.findOne({
        where: {
          group: { id: groupId },
          student: { id: student.id },
        },
      });

      if (existingRelation) {
        throw new BadRequestException(
          `Student with ID ${student.id} is already assigned to this group`
        );
      }

      const groupStudent = await this.groupStudentRepository.save({
        group,
        student,
        status,
        start_date: group.start_date,
        end_date: group.end_date,
      });
      groupStudentsToSave.push(groupStudent);

      const attendances =
        await this.attendanceService.createAllAttendancesForGroupStudent(
          groupStudent.id
        );
      result.push({ groupStudent, attendances });
    }
    return result;
  }

  async findAll(): Promise<GroupStudent[]> {
    return await this.groupStudentRepository.find({
      relations: ["group", "student"],
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<GroupStudent> {
    const groupStudent = await this.groupStudentRepository.findOne({
      where: { id },
      relations: ["group", "student"],
    });

    if (!groupStudent) {
      throw new NotFoundException(
        `Group-student relationship with ID ${id} not found`
      );
    }

    return groupStudent;
  }

  async update(
    id: number,
    updateGroupStudentDto: UpdateGroupStudentDto
  ): Promise<GroupStudent> {
    const groupStudent = await this.findOne(id);

    const { groupId, studentId } = updateGroupStudentDto;

    if (groupId && groupId !== groupStudent.group.id) {
      const group = await this.groupRepository.findOne({
        where: { id: groupId },
      });
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }
      const existingRelation = await this.groupStudentRepository.findOne({
        where: {
          group: { id: groupId || groupStudent.group.id },
          student: { id: studentId },
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new BadRequestException(
          "Student is already assigned to this group"
        );
      }
      groupStudent.group = group;
    }

    if (studentId && studentId !== groupStudent.student.id) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      const existingRelation = await this.groupStudentRepository.findOne({
        where: {
          group: { id: groupId || groupStudent.group.id },
          student: { id: studentId },
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new BadRequestException(
          "Student is already assigned to this group"
        );
      }

      groupStudent.student = student;
    }

    return await this.groupStudentRepository.save(groupStudent);
  }

  async remove(id: number): Promise<{ message: string }> {
    const groupStudent = await this.findOne(id);

    await this.groupStudentRepository.remove(groupStudent);

    return {
      message: `Group-student relationship with ID ${id} has been deleted successfully`,
    };
  }

  async findByGroup(groupId: number): Promise<GroupStudent[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const groupStudents: GroupStudent[] =
      await this.groupStudentRepository.find({
        where: { group: { id: groupId } },
        relations: ["student", "student.attendance"],
        order: { id: "ASC" },
      });
    return groupStudents;
  }

  async findByStudent(studentId: number): Promise<GroupStudent[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return await this.groupStudentRepository.find({
      where: { student: { id: studentId } },
      relations: ["group"],
      order: { id: "ASC" },
    });
  }

  async findActiveStudentsInGroup(groupId: number) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ["lessons"],
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const today1 = new Date();
    today1.setHours(0, 0, 0, 0);
    const lesson = await this.lessonRepository.findOne({
      where: { date: today1, group: { id: group.id } },
    });
    if (!lesson) {
      throw new NotFoundException(`No lesson found for group ${groupId} today`);
    }
    if (lesson.status !== LessonStatus.NEW) {
      throw new BadRequestException("Attendance for this lesson was recorded.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lessonDate = new Date(lesson.date);
    lessonDate.setHours(0, 0, 0, 0);
    if (lessonDate.getTime() !== today.getTime()) {
      throw new BadRequestException(
        "Attendance can only be updated for today's lesson."
      );
    }

    const groupStudents = await this.groupStudentRepository.find({
      where: {
        group: { id: groupId },
        status: true,
      },
      relations: ["student"],
      order: { id: "ASC" },
    });

    const isAttended = lesson.status !== LessonStatus.NEW;

    return { success: true, groupStudents, isAttended };
  }

  async deactivateStudent(id: number): Promise<GroupStudent> {
    const groupStudent = await this.findOne(id);
    groupStudent.status = false;
    return await this.groupStudentRepository.save(groupStudent);
  }

  async activateStudent(id: number): Promise<GroupStudent> {
    const groupStudent = await this.findOne(id);
    groupStudent.status = true;
    return await this.groupStudentRepository.save(groupStudent);
  }
}
