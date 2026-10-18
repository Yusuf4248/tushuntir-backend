import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DeepPartial, In, MoreThanOrEqual } from "typeorm";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance, AttendanceStatus } from "./entities/attendance.entity";
import { Repository } from "typeorm";
import { StudentService } from "../student/student.service";
import { LessonsService } from "../lessons/lessons.service";
import { Student } from "../student/entities/student.entities";
import { Lesson, LessonStatus } from "../lessons/entities/lesson.entity";
import { ClassesService } from "../modules/school/classes/classes.service";
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
    @Inject(forwardRef(() => ClassesService))
    private readonly classesService: ClassesService,
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

  async getStudentAllAttendances(studentId: number, classId: number) {
    const { student } = await this.studentService.findOne(studentId);
    const { schoolClass } = await this.classesService.findOne(classId);
    const attendances = await this.attendanceRepo.find({
      where: {
        student: { id: student.id },
        lesson: { schoolClass: { id: schoolClass.id } },
      },
      relations: ["lesson", "lesson.schoolClass", "student"],
    });
    return {
      message: `All attendances for student ${studentId} in class ${classId}`,
      success: true,
      attendances,
    };
  }

  async createAllAttendancesForGroupStudent(groupStudentId: number) {
    const groupStudent = await this.groupStudentService.findOne(groupStudentId);
    const today = dayjs().startOf("day").toDate();
    const lessons = await this.lessonRepo.find({
      where: {
        schoolClass: { id: groupStudent.schoolClass.id },
        date: MoreThanOrEqual(today),
      },
      relations: ["schoolClass", "room"],
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

  async deleteAllAttendanceForGroupStudent(groupStudentId: number) {
    const groupStudent = await this.groupStudentService.findOne(groupStudentId);
    const today = dayjs().startOf("day").toDate();
    const lessons = await this.lessonRepo.find({
      where: {
        schoolClass: { id: groupStudent.schoolClass.id },
        date: MoreThanOrEqual(today),
      },
      order: { date: "ASC" },
    });
    await Promise.all(
      lessons.map((lesson) =>
        this.attendanceRepo.delete({ lesson: { id: lesson.id } })
      )
    );
  }

  async getAttendancesByLesson(lessonId: number) {
    const { lesson } = await this.lessonService.findOne(lessonId);
    const attendances = await this.attendanceRepo.find({
      where: { lesson: { id: lesson.id } },
      relations: ["student"],
      order: { date: "ASC" },
    });

    return {
      message: `Attendances for lesson ${lessonId}`,
      success: true,
      attendances,
    };
  }

  // async updateAttendanceForClass(dto: UpdateLessonAttendancesDto) {
  //   if (isNaN(dto.lessonId))
  //     throw new BadRequestException("lessonId must be a number");
  //   // 1. Find lesson
  //   const lesson = await this.lessonRepo.findOne({
  //     where: { id: dto.lessonId },
  //     relations: ["schoolClass"],
  //   });

  //   if (!lesson) {
  //     throw new NotFoundException("Lesson not found");
  //   }

  //   // 2. Has the attendance already been recorded?
  //   if (lesson.status !== LessonStatus.NEW) {
  //     throw new BadRequestException(
  //       "Attendance for this class has already been recorded."
  //     );
  //   }

  //   // 3. Date check (is it today?)
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const lessonDate = new Date(lesson.date);
  //   lessonDate.setHours(0, 0, 0, 0);

  //   if (lessonDate.getTime() !== today.getTime()) {
  //     throw new BadRequestException(
  //       "Attendance can only be held for today's lesson."
  //     );
  //   }

  //   // 4. Lesson update (title and status)
  //   await this.lessonRepo.update(
  //     { id: dto.lessonId },
  //     { status: LessonStatus.IN_PROGRESS, title: dto.lessonTitle }
  //   );

  //   // 5. Get active students
  //   const activeClassData =
  //     await this.groupStudentService.findActiveStudentsInClassForAttendance(
  //       lesson.schoolClass.id
  //     );
  //   const activeStudentIds: number[] = activeClassData.groupStudents.map(
  //     (gs) => gs.student.id
  //   );

  //   // 6. Retrieve existing attendance records
  //   const existingAttendances = await this.attendanceRepo.find({
  //     where: {
  //       lesson: { id: dto.lessonId },
  //       student: { id: In(activeStudentIds) },
  //     },
  //     relations: ["student"],
  //   });

  //   // 7. Update only relevant students according to DTO
  //   const updatedAttendances = dto.students
  //     .filter((studentDto) => activeStudentIds.includes(studentDto.studentId))
  //     .map((studentDto) => {
  //       const attendance = existingAttendances.find(
  //         (a) => a.student.id === studentDto.studentId
  //       );
  //       if (attendance) {
  //         attendance.status = studentDto.status;
  //         return attendance;
  //       }
  //       return null;
  //     })
  //     .filter(Boolean); // removes nulls

  //   await this.attendanceRepo.save(
  //     updatedAttendances.filter(Boolean) as DeepPartial<Attendance>[]
  //   );

  //   // 8. Fetch updated attendances to return
  //   const resultAttendances = await this.attendanceRepo.find({
  //     where: {
  //       lesson: { id: dto.lessonId },
  //       student: { id: In(updatedAttendances.map((a) => a!.student.id)) },
  //     },
  //     relations: ["student"],
  //   });

  //   return {
  //     message: "Attendance updated successfully",
  //     updatedAttendances: resultAttendances,
  //   };
  // }

  async updateAttendanceForClass(dto: UpdateLessonAttendancesDto) {
    if (isNaN(dto.lessonId)) {
      throw new BadRequestException("lessonId must be a number");
    }

    // 1. Find lesson
    const lesson = await this.lessonRepo.findOne({
      where: { id: dto.lessonId },
      relations: ["schoolClass"],
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    // 2. Attendance already recorded?
    if (lesson.status != "new") {
      throw new BadRequestException(
        "Attendance for this class has already been recorded."
      );
    }

    // 3. Date check (is it today?)
    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lessonDate = new Date(lesson.date);
    lessonDate.setHours(0, 0, 0, 0);

    if (lessonDate.getTime() !== today.getTime()) {
      throw new BadRequestException(
        "Attendance can only be held for today's lesson."
      );
    }

    // 3.1. Start time check (attendance oldin bo‘lmasin)
    if (lesson.schoolClass.start_time) {
      const [hours, minutes] = lesson.schoolClass.start_time.split(":").map(Number);
      const lessonStart = new Date();
      lessonStart.setHours(hours, minutes, 0, 0);

      if (now < lessonStart) {
        throw new BadRequestException(
          `Attendance can only be recorded after the lesson starts at ${lesson.schoolClass.start_time}`
        );
      }
    }

    // 4. Lesson update
    await this.lessonRepo.update(dto.lessonId, {
      status: LessonStatus.IN_PROGRESS,
      title: dto.lessonTitle,
    });

    // 5. Active students
    const activeClassData =
      await this.groupStudentService.findActiveStudentsInClassForAttendance(
        lesson.schoolClass.id
      );
    const activeStudentIds = activeClassData.groupStudents.map(
      (gs) => gs.student.id
    );

    if (!activeStudentIds.length) {
      return { message: "No active students in this class" };
    }

    // 6. Existing attendances
    const existingAttendances = await this.attendanceRepo.find({
      where: {
        lesson: { id: dto.lessonId },
        student: { id: In(activeStudentIds) },
      },
      relations: ["student"],
    });

    // 7. Update statuses
    const studentStatusMap = new Map(
      dto.students.map((s) => [Number(s.studentId), s.status])
    );

    for (const attendance of existingAttendances) {
      const newStatus = studentStatusMap.get(attendance.student.id);
      if (newStatus) {
        attendance.status = newStatus;
      }
    }

    await this.attendanceRepo.save(existingAttendances);

    // 8. Return updated data
    return {
      message: "Attendance updated successfully",
      updatedAttendances: existingAttendances,
    };
  }

  async isLessonAttendedByDate(classId: number, date: Date) {
    // date ni 00:00:00 qilib normalize qilamiz
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const today1 = dayjs()
      .tz("Asia/Tashkent")
      .startOf("day")
      .add(5, "hour")
      .toDate();

    // Shu sanaga va classId ga mos darsni topamiz
    const lesson = await this.lessonRepo.findOne({
      where: {
        schoolClass: { id: classId },
        date: today1,
      },
      relations: ["schoolClass"],
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    // Dars kuni bugunligini tekshiramiz
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lessonDate = new Date(lesson.date);
    lessonDate.setHours(0, 0, 0, 0);

    const isToday = lessonDate.getTime() === today.getTime();
    if (!isToday) {
      throw new BadRequestException(
        "Attendance is only possible for today's class."
      );
    }

    if (lesson.status === LessonStatus.NEW) {
      const groupStudents =
        await this.groupStudentService.findActiveStudentsInClass(
          lesson.schoolClass.id
        );

      return {
        isAttended: false,
        groupStudents,
        lessonInfo: {
          id: lesson.id,
          title: lesson.title,
          start_time: lesson.schoolClass.start_time,
          end_time: lesson.schoolClass.end_time,
          className: lesson.schoolClass.name,
        },
      };
    } else {
      return {
        isAttended: true,
        message: "Attendance for this lesson has already been taken.",
      };
    }
  }
}
