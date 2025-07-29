import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { In, MoreThanOrEqual } from "typeorm";
import * as dayjs from "dayjs";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance, AttendanceStatus } from "./entities/attendance.entity";
import { Repository } from "typeorm";
import { StudentService } from "../student/student.service";
import { LessonsService } from "../lessons/lessons.service";
import { Student } from "../student/entities/student.entities";
import { Lesson, LessonStatus } from "../lessons/entities/lesson.entity";
import { GroupService } from "../group/group.service";
import { GroupStudentsService } from "../group-students/group-students.service";
import { UpdateLessonAttendancesDto } from "./dto/update-lesson-attendances-dto";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @Inject(forwardRef(() => StudentService))
    private readonly studentService: StudentService,
    @Inject(forwardRef(() => LessonsService))
    private readonly lessonService: LessonsService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: GroupService,
    @Inject(forwardRef(() => GroupStudentsService))
    private groupStudentService: GroupStudentsService
  ) {}
  async create(createAttendanceDto: CreateAttendanceDto) {
    const { lessonId, studentId } = createAttendanceDto;
    const { student } = await this.studentService.findOne(studentId);
    const { lesson } = await this.lessonService.findOne(lessonId);
    const attendance = this.attendanceRepo.create({
      ...createAttendanceDto,
      lesson,
      student,
      date: lesson.date,
    });
    return this.attendanceRepo.save(attendance);
  }

  async findAll() {
    const attendance = await this.attendanceRepo.find({
      relations: ["student", "lesson"],
    });
    return {
      message: "All attandances",
      success: true,
      attendance,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    const attandance = await this.attendanceRepo.findOne({
      where: { id },
      relations: ["student", "lesson"],
    });
    if (!attandance) {
      throw new NotFoundException(`${id}-attandances not found`);
    }
    return {
      message: `${id}-attandances`,
      success: true,
      attandance,
    };
  }

  async update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    await this.findOne(id);

    let student: Student | null = null;
    let lesson: Lesson | null = null;

    if (updateAttendanceDto.studentId) {
      const newStudent = await this.studentService.findOne(
        updateAttendanceDto.studentId
      );
      student = newStudent.student;
    }

    if (updateAttendanceDto.lessonId) {
      const newLesson = await this.lessonService.findOne(
        updateAttendanceDto.lessonId
      );
      lesson = newLesson.lesson;
    }

    const updateData: any = {
      ...updateAttendanceDto,
      ...(student && { student }),
      ...(lesson && { lesson }),
    };

    await this.attendanceRepo.update({ id }, updateData);

    const attandance = await this.findOne(id);

    return {
      message: `${id}-attendance data updated!`,
      success: true,
      attandance,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.attendanceRepo.delete(id);

    return {
      message: `${id}-attandance deleted!`,
      success: true,
    };
  }

  async getStudentAllAttendances(studentId: number, groupId: number) {
    const { student } = await this.studentService.findOne(studentId);
    const { group } = await this.groupService.findOne(groupId);
    const attendances = await this.attendanceRepo.find({
      where: { student, lesson: { group } },
      relations: ["lesson"],
    });
    return {
      message: `All attendances for student ${studentId} in group ${groupId}`,
      success: true,
      attendances,
    };
  }

  async createAllAttendancesForGroupStudent(groupStudentId: number) {
    const groupStudent = await this.groupStudentService.findOne(groupStudentId);
    const today = dayjs().startOf("day").toDate();
    const lessons = await this.lessonRepo.find({
      where: {
        group: { id: groupStudent.group.id },
        date: MoreThanOrEqual(today),
      },
      relations: ["group", "room"],
      order: { date: "ASC" },
    });

    const attendancesToCreate = lessons.map((lesson) =>
      this.attendanceRepo.create({
        student: groupStudent.student,
        lesson,
        date: lesson.date,
        status: AttendanceStatus.PENDING,
      })
    );
    const savedAttendances =
      await this.attendanceRepo.save(attendancesToCreate);
    return savedAttendances;
  }

  async getAttendancesByLesson(lessonId: number) {
    const { lesson } = await this.lessonService.findOne(lessonId);
    const attendances = await this.attendanceRepo.find({
      where: { lesson },
      relations: ["student"],
      order: { date: "ASC" },
    });

    return {
      message: `Attendances for lesson ${lessonId}`,
      success: true,
      attendances,
    };
  }

  async updateAttendanceForGroup(dto: UpdateLessonAttendancesDto) {
    const { lesson } = await this.lessonService.findOne(dto.lessonId);
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

    lesson.status = LessonStatus.IN_PROGRESS;
    lesson.title = dto.lessonTitle;
    await this.lessonService.save(lesson);

    // Faol studentlarni olish
    const activeStudents =
      await this.groupStudentService.findActiveStudentsInGroup(lesson.group.id);
    const studentIds = activeStudents.groupStudents.map((gs) => gs.student.id);

    const existingAttendances = await this.attendanceRepo.find({
      where: { lesson: { id: dto.lessonId }, student: { id: In(studentIds) } },
      relations: ["student"],
    });

    const attendanceUpdates = dto.students
      .filter((studentDto) => studentIds.includes(studentDto.studentId))
      .map((studentDto) => {
        const existingAttendance = existingAttendances.find(
          (attendance) => attendance.student.id === studentDto.studentId
        );
        if (existingAttendance) {
          existingAttendance.status = studentDto.status;
          return existingAttendance;
        }
        return null;
      })
      .filter((attendance) => attendance !== null);

    await this.attendanceRepo.save(attendanceUpdates);
    return { message: "Attendance updated successfully" };
  }

  async isLessonAttended(date: Date) {
    // date yoki lessonId dan bittasi berilishi kerak
    let isAttended = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lesson = await this.lessonRepo.findOne({
      where: {
        date: today,
      },
    });
    if (!lesson) {
      return { message: "No lesson fount for today" };
    }
    if (lesson.status !== LessonStatus.NEW) {
      // shu yerda guruhdagi studentlar va qoshimcha malumotlar berib yuborilishi kerak
      const groupStudents =
        await this.groupStudentService.findActiveStudentsInGroup(
          lesson.group.id
        );
      return {
        isAttended: false,
        groupStudents,
      };
    } else {
      throw new BadRequestException("Attendance for this lesson was recorded.");
    }
  }
}
