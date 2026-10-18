import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { CreateClassStudentDto } from "./dto/create-class-student.dto";
import { UpdateClassStudentDto } from "./dto/update-class-student.dto";
import { ClassStudent } from "./entities/class-student.entity";
import { SchoolClass } from "../classes/entities/school-class.entity";
import { Student } from "../../../student/entities/student.entities";
import { AttendanceService } from "../../../attendance/attendance.service";
import { Attendance } from "../../../attendance/entities/attendance.entity";
import { LessonsService } from "../../daily/lessons/lessons.service";
import { Lesson, LessonStatus } from "../../daily/lessons/entities/lesson.entity";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

@Injectable()
export class ClassStudentsService {
  constructor(
    @InjectRepository(ClassStudent)
    private readonly classStudentRepository: Repository<ClassStudent>,
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

  async create(createClassStudentDto: CreateClassStudentDto) {
    const { classId, studentId, status = true } = createClassStudentDto;

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
      classStudent: ClassStudent;
      attendances: Attendance[];
    }[] = [];

    const classStudentsToSave: ClassStudent[] = [];

    for (const student of students) {
      const existingRelation = await this.classStudentRepository.findOne({
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

      const classStudent = await this.classStudentRepository.save({
        schoolClass,
        student,
        status,
        start_date: schoolClass.start_date,
        end_date: schoolClass.end_date,
      });
      classStudentsToSave.push(classStudent);

      const attendances =
        await this.attendanceService.createAllAttendancesForClassStudent(
          classStudent.id
        );
      result.push({ classStudent, attendances });
    }
    return result;
  }

  async findAll(): Promise<ClassStudent[]> {
    return await this.classStudentRepository.find({
      relations: ["schoolClass", "student"],
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<ClassStudent> {
    const classStudent = await this.classStudentRepository.findOne({
      where: { id },
      relations: ["schoolClass", "student"],
    });

    if (!classStudent) {
      throw new NotFoundException(
        `Class-student relationship with ID ${id} not found`
      );
    }

    return classStudent;
  }

  async update(
    id: number,
    updateClassStudentDto: UpdateClassStudentDto
  ): Promise<ClassStudent> {
    const classStudent = await this.findOne(id);

    const { classId, studentId } = updateClassStudentDto;

    if (classId && classId !== classStudent.schoolClass.id) {
      const schoolClass = await this.classRepository.findOne({
        where: { id: classId },
      });
      if (!schoolClass) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }
      const existingRelation = await this.classStudentRepository.findOne({
        where: {
          schoolClass: { id: classId || classStudent.schoolClass.id },
          student: { id: studentId },
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new BadRequestException(
          "Student is already assigned to this class"
        );
      }
      classStudent.schoolClass = schoolClass;
    }

    if (studentId && studentId !== classStudent.student.id) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      const existingRelation = await this.classStudentRepository.findOne({
        where: {
          schoolClass: { id: classId || classStudent.schoolClass.id },
          student: { id: studentId },
        },
      });

      if (existingRelation && existingRelation.id !== id) {
        throw new BadRequestException(
          "Student is already assigned to this class"
        );
      }

      classStudent.student = student;
    }

    return await this.classStudentRepository.save(classStudent);
  }

  async remove(id: number): Promise<{ message: string }> {
    const classStudent = await this.findOne(id);
    await this.attendanceService.deleteAllAttendanceForClassStudent(id);
    await this.classStudentRepository.remove(classStudent);

    return {
      message: `Class-student relationship with ID ${id} has been deleted successfully`,
    };
  }

  async findByClass(classId: number): Promise<ClassStudent[]> {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const classStudents: ClassStudent[] =
      await this.classStudentRepository.find({
        where: { schoolClass: { id: classId } },
        relations: ["student", "student.attendance"],
        order: { id: "ASC" },
      });
    return classStudents;
  }

  async findByStudent(studentId: number): Promise<ClassStudent[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return await this.classStudentRepository.find({
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

    const classStudents = await this.classStudentRepository.find({
      where: {
        schoolClass: { id: classId },
        status: true,
      },
      relations: ["student"],
      order: { id: "ASC" },
    });

    return { success: true, classStudents };
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

    const classStudents = await this.classStudentRepository.find({
      where: {
        schoolClass: { id: classId },
        status: true,
      },
      relations: ["student"],
      order: { id: "ASC" },
    });

    const isAttended = lesson.status !== LessonStatus.NEW;

    return { success: true, classStudents, isAttended };
  }

  async deactivateStudent(id: number): Promise<ClassStudent> {
    const classStudent = await this.findOne(id);
    classStudent.status = false;
    return await this.classStudentRepository.save(classStudent);
  }

  async activateStudent(id: number): Promise<ClassStudent> {
    const classStudent = await this.findOne(id);
    classStudent.status = true;
    return await this.classStudentRepository.save(classStudent);
  }
}
