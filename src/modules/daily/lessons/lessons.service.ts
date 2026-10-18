import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Lesson, LessonStatus } from "./entities/lesson.entity";
import { Between, MoreThan, Repository } from "typeorm";
import { ClassesService } from "../../school/classes/classes.service";
import { addDays, isAfter } from "date-fns";
import { SchoolClass } from "../../school/classes/entities/school-class.entity";
import { Room } from "../../school/rooms/entities/room.entity";
import { ClassStudent } from "../../school/class-students/entities/class-student.entity";
import { TeacherAssignment } from "../../school/teacher-assignments/entities/teacher-assignment.entity";
import { UpdateLessonStatusDto } from "./dto/update-lesson-status.dto";

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @Inject(forwardRef(() => ClassesService))
    private readonly classesService: ClassesService,
    @InjectRepository(SchoolClass) private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,
    @InjectRepository(TeacherAssignment)
    private readonly teacherAssignmentRepo: Repository<TeacherAssignment>
  ) {}

  async create(createLessonDto: CreateLessonDto) {
    const { classId, roomId } = createLessonDto;

    const { schoolClass } = await this.classesService.findOne(classId);
    const room = await this.roomRepo.findOne({ where: { id: roomId } });

    if (!room) {
      throw new NotFoundException("Room not found. Please check roomId");
    }

    const lesson = await this.lessonRepo.save({
      ...createLessonDto,
      schoolClass,
      room,
    });

    const newEndDate = lesson.date;
    if (
      newEndDate &&
      isAfter(new Date(newEndDate), new Date(schoolClass!.end_date))
    ) {
      schoolClass!.end_date = newEndDate;
      await this.classRepo.save(schoolClass!);

      await this.classStudentRepo
        .createQueryBuilder()
        .update()
        .set({ end_date: newEndDate })
        .where("class_id = :classId", { classId: schoolClass!.id })
        .execute();
      await this.teacherAssignmentRepo
        .createQueryBuilder()
        .update()
        .set({ end_date: newEndDate })
        .where("class_id = :classId", { classId: schoolClass!.id })
        .execute();
    }

    return {
      message: `New lesson created`,
      success: true,
      lesson,
    };
  }

  async createAllLessons({
    roomId,
    classId,
  }: {
    roomId: number;
    classId: number;
  }) {
    const lessonDates = await this.generateLessonDates(classId);

    let schoolClass = await this.classRepo.findOne({
      where: { id: classId },
      relations: ["subject"],
    });

    if (!schoolClass) {
      throw new NotFoundException(`Class ID-${classId} not found`);
    }

    const startDateString = `${schoolClass.start_date}T${
      schoolClass.start_time.length === 5
        ? schoolClass.start_time + ":00"
        : schoolClass.start_time
    }`;
    const start_time = new Date(startDateString);

    if (isNaN(start_time.getTime())) {
      throw new Error("Invalid start_time or start_date format");
    }

    const end_time = new Date(
      start_time.getTime() + schoolClass.subject.lesson_duration * 60 * 1000
    );

    await this.classRepo.update(
      { id: classId },
      {
        end_date: lessonDates[lessonDates.length - 1]
          .toISOString()
          .split("T")[0],
        end_time: end_time.toTimeString().slice(0, 5),
      }
    );

    schoolClass = await this.classRepo.findOne({
      where: { id: classId },
      relations: ["subject"],
    });

    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException(`Room ID-${roomId} not found`);
    }

    const lessons: Lesson[] = [];

    for (let i = 0; i < lessonDates.length; i++) {
      const date = lessonDates[i];

      const lesson = await this.lessonRepo.save({
        schoolClass: { ...schoolClass },
        date,
        title: `Lesson ${i + 1}`,
        notes: `Lesson ${i + 1} - Class ${schoolClass!.name}`,
        room: { ...room },
      });

      lessons.push(lesson);
    }

    return lessons;
  }

  async generateLessonDates(classId: number): Promise<Date[]> {
    const schoolClass = await this.classRepo.findOne({
      where: { id: classId },
      relations: ["subject"],
    });

    if (!schoolClass) {
      throw new NotFoundException(`Class ID-${classId} not found`);
    }

    const lessonDates: Date[] = [];
    const totalLessons: number =
      schoolClass.subject.lessons_in_a_month * schoolClass.subject.duration;

    let currentDate = new Date(schoolClass.start_date);
    const lessonsInWeek = schoolClass.subject.lessons_in_a_week;

    if (lessonsInWeek === 5) {
      // Har kuni Dushanba - Juma oraliqda dars
      while (lessonDates.length < totalLessons) {
        const day = currentDate.getDay();
        if (day >= 1 && day <= 5) {
          lessonDates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }
    } else {
      // Juft yoki toq kunlar bo'yicha dars (2 kun ketma-ket emas)
      const firstDay = currentDate.getDay();
      const isEven = [1, 3, 5].includes(firstDay); // Dushanba, Chorshanba, Juma
      const validDays = isEven ? [1, 3, 5] : [2, 4, 6]; // juft yoki toq kunlar

      let lastLessonDate: Date | null = null;

      while (lessonDates.length < totalLessons) {
        const day = currentDate.getDay();

        if (validDays.includes(day)) {
          const isConsecutive =
            lastLessonDate &&
            (currentDate.getTime() - lastLessonDate.getTime()) /
              (1000 * 60 * 60 * 24) <
              2;

          if (!isConsecutive) {
            lessonDates.push(new Date(currentDate));
            lastLessonDate = new Date(currentDate);
          }
        }

        currentDate = addDays(currentDate, 1);
      }
    }

    return lessonDates;
  }

  async generateNextLessonDate(lastDate: Date): Promise<Date> {
    if (!lastDate || isNaN(lastDate.getTime())) {
      throw new BadRequestException("Invalid last lesson date");
    }

    const lesson = await this.lessonRepo.findOne({
      where: { date: lastDate },
      relations: ["schoolClass", "schoolClass.subject"],
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found for the given date");
    }

    const lessonsInWeek = lesson.schoolClass.subject.lessons_in_a_week;

    const currentDate = new Date(lastDate);
    let nextDate = new Date(currentDate);

    if (lessonsInWeek === 5) {
      // Har kuni (Dushanba - Juma)
      const currentDay = currentDate.getDay(); // 1 - Dushanba, 5 - Juma
      if (currentDay >= 1 && currentDay <= 4) {
        // Haftaning ish kuni → ertasi ish kuni
        nextDate.setDate(currentDate.getDate() + 1);
      } else if (currentDay === 5) {
        // Juma → Dushanba (2 kun o'tkazib)
        nextDate.setDate(currentDate.getDate() + 3);
      } else if (currentDay === 6) {
        // Shanba → Dushanba
        nextDate.setDate(currentDate.getDate() + 2);
      } else if (currentDay === 0) {
        // Yakshanba → Dushanba
        nextDate.setDate(currentDate.getDate() + 1);
      }
    } else if (lessonsInWeek === 3) {
      // Dars kunlari: Dush-Chor-Juma yoki Ses-Pays-Shan
      const day = currentDate.getDay(); // 0 = Yakshanba, 1 = Dushanba ...

      let schedule: number[];

      if ([1, 3, 5].includes(day)) {
        schedule = [1, 3, 5]; // Dush - Chor - Juma
      } else {
        schedule = [2, 4, 6]; // Ses - Pays - Shan
      }

      const next = schedule.find((d) => d > day);
      if (next) {
        const diff = next - day;
        nextDate.setDate(currentDate.getDate() + diff);
      } else {
        // Agar bu hafta oxiri bo'lsa → keyingi haftaning birinchi dars kuni
        const daysUntilNext = 7 - day + schedule[0];
        nextDate.setDate(currentDate.getDate() + daysUntilNext);
      }
    } else {
      throw new BadRequestException("Unsupported number of lessons in a week");
    }

    return nextDate;
  }

  async updateLessonStatus(id: number, body: UpdateLessonStatusDto) {
    const { status, note, date } = body;

    const oldLessonRecord = await this.findOne(id);
    if (!oldLessonRecord.lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    const classId = oldLessonRecord.lesson.schoolClass.id;

    const schoolClass = await this.classRepo.findOne({ where: { id: classId } });

    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException("Invalid date format");
      }

      if (parsedDate < new Date()) {
        throw new BadRequestException("Date cannot be in the past");
      }

      //  Shu sana uchun lesson mavjudligini tekshirish
      const isLessonExist = await this.lessonRepo.findOne({
        where: { date: parsedDate },
      });
      if (isLessonExist) {
        throw new BadRequestException(
          `A lesson already exists on ${parsedDate.toISOString().split("T")[0]}`
        );
      }
      // Eski lessonni update qilish
      await this.lessonRepo.update(id, {
        status,
        notes: note,
      });

      const lastLesson = await this.shiftLessons(classId, id, parsedDate);

      //  Yangi lesson yaratish (agar kerak bo'lsa qo'shimcha maydonlar qo'shing)
      const newLesson = this.lessonRepo.save({
        title: `Lesson ${this.extractLessonNumber(lastLesson!.title) + 1}`,
        notes: `Lesson ${this.extractLessonNumber(lastLesson!.title) + 1} - Class ${schoolClass!.name}`,
        schoolClass: { ...schoolClass },
        date: parsedDate,
        status: LessonStatus.NEW,
        room: oldLessonRecord.lesson.room,
      });

      return {
        message: "Lesson updated and new lesson created on given date!",
        success: true,
        newLesson: newLesson,
      };
    } else {
      // ❗Eski lessonni update qilish
      await this.lessonRepo.update(id, { status, notes: note });

      // ❗Gruppa darslarini surish
      await this.shiftLessons(classId, id);

      // ✅ Oxirgi darsni topamiz
      const lastLesson = await this.lessonRepo.findOne({
        where: { schoolClass: { id: classId } },
        order: { date: "DESC" },
      });

      // ✅ Yangi sanani hisoblaymiz
      const nextDate = await this.generateNextLessonDate(lastLesson!.date);

      // ✅ Yangi lesson yaratamiz
      const newLesson = this.lessonRepo.create({
        title: `Lesson ${this.extractLessonNumber(lastLesson!.title) + 1}`,
        notes: `Lesson ${this.extractLessonNumber(lastLesson!.title) + 1} - Class ${schoolClass!.name}`,
        schoolClass: { ...schoolClass },
        date: nextDate,
        status: LessonStatus.NEW,
        room: oldLessonRecord.lesson.room,
      });
      await this.lessonRepo.save(newLesson);

      return {
        message: "Lesson updated and new lesson created with next week date!",
        success: true,
        newLesson,
      };
    }
  }

  async shiftLessons(
    classId: number,
    canceledLessonId: number,
    date: Date | null = null
  ) {
    if (date) {
      const canceledLesson = await this.lessonRepo.findOne({
        where: { id: canceledLessonId, schoolClass: { id: classId } },
      });
      if (!canceledLesson) throw new NotFoundException("Lesson not found");

      const laterLessons = await this.lessonRepo.find({
        where: {
          schoolClass: { id: classId },
          date: Between(new Date(canceledLesson.date.getTime() + 1), date),
        },
        relations: ["schoolClass"],
        order: { date: "ASC" },
      });

      let lastUpdatedLesson: Lesson | null = null;

      for (const lesson of laterLessons) {
        const oldNumber = this.extractLessonNumber(lesson.title);
        const className = lesson.schoolClass.name;
        lesson.title = `Lesson ${oldNumber - 1}`;
        lesson.notes = `Lesson ${oldNumber - 1} - Class${className}`;
        lastUpdatedLesson = await this.lessonRepo.save(lesson);
      }
      return lastUpdatedLesson;
    } else {
      const canceledLesson = await this.lessonRepo.findOne({
        where: { id: canceledLessonId, schoolClass: { id: classId } },
      });
      if (!canceledLesson) throw new NotFoundException("Lesson not found");

      const laterLessons = await this.lessonRepo.find({
        where: {
          schoolClass: { id: classId },
          date: MoreThan(canceledLesson.date),
        },
        relations: ["schoolClass"],
        order: { date: "ASC" },
      });

      // 3. Har bir lessonni 1 ta oldingi raqam bilan yangilaymiz
      for (const lesson of laterLessons) {
        const oldNumber = this.extractLessonNumber(lesson.title);
        const className = lesson.schoolClass.name;
        lesson.title = `Lesson ${oldNumber - 1}`;
        lesson.notes = `Lesson ${oldNumber - 1} - Class${className}`;
        await this.lessonRepo.save(lesson);
      }
    }
  }

  // async completeExpiredLessons(): Promise<void> {
  //   const now = new Date();
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0); // to get start of today

  //   // IN_PROGRESS lessonlarni schoolClass bilan birga chaqiramiz
  //   const inProgressLessons = await this.lessonRepo.find({
  //     where: { status: LessonStatus.IN_PROGRESS },
  //     relations: ["schoolClass"],
  //   });

  //   const lessonsToUpdate: Lesson[] = [];

  //   for (const lesson of inProgressLessons) {
  //     const lessonDate = new Date(lesson.date);
  //     lessonDate.setHours(0, 0, 0, 0);

  //     const isToday = lessonDate.getTime() === today.getTime();

  //     if (isToday) {
  //       // Faqat bugungi darslar uchun: end_time bilan solishtiramiz
  //       const [endHour, endMinute] = lesson.schoolClass.end_time
  //         .split(":")
  //         .map(Number);

  //       const lessonEndTime = new Date(lesson.date);
  //       lessonEndTime.setHours(endHour, endMinute, 0, 0);

  //       if (now > lessonEndTime) {
  //         lesson.status = LessonStatus.COMPLETED;
  //         lessonsToUpdate.push(lesson);
  //       }
  //     } else if (lesson.date < now) {
  //       // Agar dars kechagi yoki undan oldin bo'lsa
  //       lesson.status = LessonStatus.COMPLETED;
  //       lessonsToUpdate.push(lesson);
  //     }
  //   }

  //   if (lessonsToUpdate.length > 0) {
  //     await this.lessonRepo.save(lessonsToUpdate);
  //   }
  // }

  async completeExpiredLessons(): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const inProgressLessons = await this.lessonRepo
        .createQueryBuilder("lesson")
        .leftJoinAndSelect("lesson.schoolClass", "schoolClass")
        .where("lesson.status = :status", { status: LessonStatus.IN_PROGRESS })
        .andWhere("lesson.date <= :now", { now })
        .getMany();

      const lessonsToUpdate: Lesson[] = [];

      for (const lesson of inProgressLessons) {
        const lessonDate = new Date(lesson.date);
        const isToday = lessonDate.toDateString() === today.toDateString();

        if (isToday) {
          const [endHour, endMinute] = lesson.schoolClass.end_time
            .split(":")
            .map((val) => {
              const num = Number(val);
              return isNaN(num) ? 0 : num;
            });

          const lessonEndTime = new Date(lesson.date);
          lessonEndTime.setHours(endHour, endMinute, 0, 0);

          if (now > lessonEndTime) {
            lesson.status = LessonStatus.COMPLETED;
            lessonsToUpdate.push(lesson);
          }
        } else if (lessonDate < today) {
          lesson.status = LessonStatus.COMPLETED;
          lessonsToUpdate.push(lesson);
        }
      }

      if (lessonsToUpdate.length > 0) {
        await this.lessonRepo.save(lessonsToUpdate, { chunk: 100 });
      }
    } catch (error) {
      console.error("Darslarni yakunlashda xatolik:", error);
      throw new Error("Yakunlanmagan darslarni yangilab bo'lmadi");
    }
  }

  private extractLessonNumber(text: string): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [lessons, total] = await this.lessonRepo.findAndCount({
      relations: ["schoolClass"],
      skip,
      take: limit,
      order: { id: "ASC" },
    });
    return {
      success: true,
      total,
      page,
      limit,
      lessons,
    };
  }

  async findClassAllLessons(classId: number) {
    const lessons = await this.lessonRepo.find({
      where: { schoolClass: { id: classId } },
      relations: ["schoolClass", "room"],
      order: { date: "ASC" },
    });
    return {
      success: true,
      lessons,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: ["schoolClass", "room"],
    });
    if (!lesson) {
      throw new NotFoundException(
        `${id}-lesson not found.Please check id and try again`
      );
    }
    return {
      success: true,
      message: `${id}-lesson`,
      lesson,
    };
  }

  async update(id: number, updateLessonDto: UpdateLessonDto) {
    await this.findOne(id);
    await this.lessonRepo.update({ id }, updateLessonDto);
    const { lesson } = await this.findOne(id);
    return {
      success: true,
      message: `${id}-lesson data updated`,
      lesson,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.lessonRepo.delete(id);

    return {
      success: true,
      message: `${id}-lesson data deleted`,
    };
  }

  async save(lesson: Lesson) {
    return await this.lessonRepo.save(lesson);
  }
}
