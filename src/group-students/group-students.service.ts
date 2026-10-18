import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { CreateGroupStudentDto } from "./dto/create-group-student.dto";
import { UpdateGroupStudentDto } from "./dto/update-group-student.dto";
import { GroupStudent } from "./entities/group-student.entity";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { Student } from "../student/entities/student.entities";
import { AttendanceService } from "../attendance/attendance.service";
import { Attendance } from "../attendance/entities/attendance.entity";
import { LessonsService } from "../lessons/lessons.service";
import { Lesson, LessonStatus } from "../lessons/entities/lesson.entity";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

@Injectable()
export class GroupStudentsService {
  constructor(
    @InjectRepository(GroupStudent)
    private readonly groupStudentRepository: Repository<GroupStudent>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @Inject(forwardRef(() => AttendanceService))
    private attendanceService: AttendanceService,
    private readonly lessonService: LessonsService,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly dataSource: DataSource
  ) {}

  async create(createGroupStudentDto: CreateGroupStudentDto) {
    const { classId, studentId, status = true } = createGroupStudentDto;

    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["lessons", "lessons.room"],
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const room = schoolClass.lessons[0].room;
    if (!room) {
      throw new NotFoundException("Room not found for this class");
    }

    const existingStudents = await this.findByClass(classId);

    if (+existingStudents.length + +studentId.length > room.capacity) {
      throw new BadRequestException("Room capacity not enaugh");
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
          schoolClass: { id: classId },
          student: { id: student.id },
        },
      });

      if (existingRelation) {
        throw new BadRequestException(
          `Student with ID ${student.id} is already assigned to this class`
        );
      }

      const groupStudent = await this.groupStudentRepository.save({
        schoolClass,
        student,
        status,
        start_date: schoolClass.start_date,
        end_date: schoolClass.end_date,
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
      relations: ["schoolClass", "student"],
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<GroupStudent> {
    const groupStudent = await this.groupStudentRepository.findOne({
      where: { id },
      relations: ["schoolClass", "student"],
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

    const { classId, studentId } = updateGroupStudentDto;

    if (classId && classId !== groupStudent.schoolClass.id) {
      const schoolClass = await this.classRepository.findOne({
        where: { id: classId },
      });
      if (!schoolClass) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }
      const existingRelation = await this.groupStudentRepository.findOne({
        where: {
          schoolClass: { id: classId || groupStudent.schoolClass.id },
          student: { id: studentId },
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new BadRequestException(
          "Student is already assigned to this class"
        );
      }
      groupStudent.schoolClass = schoolClass;
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
          schoolClass: { id: classId || groupStudent.schoolClass.id },
          student: { id: studentId },
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new BadRequestException(
          "Student is already assigned to this class"
        );
      }

      groupStudent.student = student;
    }

    return await this.groupStudentRepository.save(groupStudent);
  }

  async remove(id: number): Promise<{ message: string }> {
    const groupStudent = await this.findOne(id);
    await this.attendanceService.deleteAllAttendanceForGroupStudent(id);
    await this.groupStudentRepository.remove(groupStudent);

    return {
      message: `Group-student relationship with ID ${id} has been deleted successfully`,
    };
  }

  async findByClass(classId: number): Promise<GroupStudent[]> {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const groupStudents: GroupStudent[] =
      await this.groupStudentRepository.find({
        where: { schoolClass: { id: classId } },
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
      relations: ["schoolClass"],
      order: { id: "ASC" },
    });
  }

  async findActiveStudentsInClass(classId: number) {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["lessons"],
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const groupStudents = await this.groupStudentRepository.find({
      where: {
        schoolClass: { id: classId },
        status: true,
      },
      relations: ["student"],
      order: { id: "ASC" },
    });

    return { success: true, groupStudents };
  }

  async findActiveStudentsInClassForAttendance(classId: number) {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["lessons"],
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    dayjs.extend(utc);
    dayjs.extend(timezone);
    const today = dayjs()
      .tz("Asia/Tashkent")
      .startOf("day")
      .add(5, "hour")
      .toDate();
    const lesson = await this.lessonRepository.findOne({
      where: { date: today, schoolClass: { id: schoolClass.id } },
    });

    if (!lesson) {
      throw new NotFoundException(`No lesson found for class ${classId} today`);
    }

    const groupStudents = await this.groupStudentRepository.find({
      where: {
        schoolClass: { id: classId },
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
