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
import { MoreThan, Repository } from "typeorm";
import { GroupService } from "../group/group.service";
import { addDays, isAfter } from "date-fns";
import { Group } from "../group/entities/group.entity";
import { Room } from "../rooms/entities/room.entity";
import { GroupStudent } from "../group-students/entities/group-student.entity";
import { GroupTeacher } from "../group-teachers/entities/group-teacher.entity";

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: GroupService,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(GroupStudent)
    private readonly groupStudentRepo: Repository<GroupStudent>,
    @InjectRepository(GroupTeacher)
    private readonly groupTeacherRepo: Repository<GroupTeacher>
  ) {}

  async create(createLessonDto: CreateLessonDto) {
    const { groupId, roomId } = createLessonDto;

    const { group } = await this.groupService.findOne(groupId);
    const room = await this.roomRepo.findOne({ where: { id: roomId } });

    if (!room) {
      throw new NotFoundException("Room not found. Please check roomId");
    }

    const lesson = await this.lessonRepo.save({
      ...createLessonDto,
      group,
      room,
    });

    const newEndDate = lesson.date;
    if (newEndDate && isAfter(new Date(newEndDate), new Date(group.end_date))) {
      group.end_date = newEndDate;
      await this.groupRepo.save(group);

      await this.groupStudentRepo
        .createQueryBuilder()
        .update()
        .set({ end_date: newEndDate })
        .where("group_id = :groupId", { groupId: group.id })
        .execute();
      await this.groupTeacherRepo
        .createQueryBuilder()
        .update()
        .set({ end_date: newEndDate })
        .where("group_id = :groupId", { groupId: group.id })
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
    groupId,
  }: {
    roomId: number;
    groupId: number;
  }) {
    const lessonDates = await this.generateLessonDates(groupId);

    let group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ["course"],
    });

    if (!group) {
      throw new NotFoundException(`Group ID-${groupId} not found`);
    }

    const startDateString = `${group.start_date}T${group.start_time.length === 5 ? group.start_time + ":00" : group.start_time}`;
    const start_time = new Date(startDateString);

    if (isNaN(start_time.getTime())) {
      throw new Error("Invalid start_time or start_date format");
    }

    const end_time = new Date(
      start_time.getTime() + group.course.lesson_duration * 1000 * 60
    );
    await this.groupRepo.update(
      { id: groupId },
      {
        end_date: lessonDates[lessonDates.length - 1]
          .toISOString()
          .split("T")[0],
        end_time: end_time.toTimeString().slice(0, 5),
      }
    );

    group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ["course"],
    });
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    const totalLessons =
      group!.course.lessons_in_a_month * group!.course.lessons_in_a_week;

    const lessons: Lesson[] = [];

    for (let i = 0; i < totalLessons; i++) {
      const date = lessonDates[i];

      const lesson = await this.lessonRepo.save({
        group: { ...group },
        date,
        title: `Lesson ${i + 1}`,
        notes: `Lesson ${i + 1} - Group ${group!.name}`,
        room: { ...room },
      });

      lessons.push(lesson);
    }

    return lessons;
  }

  async generateLessonDates(groupId: number) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ["course"],
    });
    if (!group) {
      throw new NotFoundException(`Group ID-${groupId} not found`);
    }

    const lessonDates: Date[] = [];
    const totalLessons =
      group.course.lessons_in_a_month * group.course.lessons_in_a_week;

    let currentDate = new Date(group.start_date);
    let weeklyLessonCount = 0;
    if (group.course.lessons_in_a_week == 5) {
      while (lessonDates.length < totalLessons) {
        const dayOfWeek = currentDate.getDay(); // 0 = Yakshanba, 6 = Shanba

        // Dushanba - Juma kunlari (1-5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          if (weeklyLessonCount < group.course.lessons_in_a_week) {
            lessonDates.push(new Date(currentDate));
            weeklyLessonCount++;
          }
        }

        // Har hafta oxiri - Yakshanba (0) da reset boladi
        if (dayOfWeek === 0) {
          weeklyLessonCount = 0;
        }

        currentDate = addDays(currentDate, 1);
      }
    } else {
      const firstDay = currentDate.getDay();

      // Juft kunlar: 1 (Dushanba), 3 (Chorshanba), 5 (Juma)
      // Toq kunlar: 2 (Seshanba), 4 (Payshanba), 6 (Shanba)
      const isEven = [1, 3, 5].includes(firstDay); // Juft kun yoki yo'qligi aniqlash
      const validDays = isEven ? [1, 3, 5] : [2, 4, 6];

      let lastLessonDate: Date | null = null;

      while (lessonDates.length < totalLessons) {
        const dayOfWeek = currentDate.getDay();

        // Faqat kerakli (juft yoki toq) kunlardagina dars bo‘ladi
        if (validDays.includes(dayOfWeek)) {
          // 2 kun ketma-ket bo‘lmasligi kerak
          const isConsecutive =
            lastLessonDate &&
            (currentDate.getTime() - lastLessonDate.getTime()) /
              (1000 * 60 * 60 * 24) <
              2;

          if (!isConsecutive) {
            lessonDates.push(new Date(currentDate));
            lastLessonDate = new Date(currentDate);
            weeklyLessonCount++;
          }
        }

        // Yakshanba kelganda haftalik hisobni nolga tushiramiz
        if (dayOfWeek === 0) {
          weeklyLessonCount = 0;
        }

        currentDate = addDays(currentDate, 1);
      }
    }

    return lessonDates;
  }

  async updateLessonStatus(id: number, status: LessonStatus, note: string) {
    await this.findOne(id);
    await this.lessonRepo.update(id, { status, notes: note });
    const { lesson } = await this.findOne(id);
    await this.shiftLessons(lesson.group.id, id);
    return {
      message: "Lesson status updated!",
      success: true,
      lesson: lesson,
    };
  }

  async shiftLessons(groupId: number, canceledLessonId: number): Promise<void> {
    const canceledLesson = await this.lessonRepo.findOne({
      where: { id: canceledLessonId, group: { id: groupId } },
    });
    if (!canceledLesson) throw new NotFoundException("Lesson not found");

    const laterLessons = await this.lessonRepo.find({
      where: {
        group: { id: groupId },
        date: MoreThan(canceledLesson.date),
      },
      relations: ["group"],
      order: { date: "ASC" },
    });

    // 3. Har bir lessonni 1 ta oldingi raqam bilan yangilaymiz
    for (const lesson of laterLessons) {
      const oldNumber = this.extractLessonNumber(lesson.title);
      const groupName = lesson.group.name;
      lesson.title = `Lesson ${oldNumber - 1}`;
      lesson.notes = `Lesson ${oldNumber - 1} - Group${groupName}`;
      await this.lessonRepo.save(lesson);
    }

    // 4. Oxirgi darsdan 1 hafta keyin yangi lesson qo‘shamiz
    // const lastLesson = laterLessons[laterLessons.length - 1];
    // const newDate = new Date(lastLesson.date);
    // newDate.setDate(newDate.getDate() + 7);

    // const newNumber = this.extractLessonNumber(lastLesson.title) + 1;
  }

  private extractLessonNumber(text: string): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [lessons, total] = await this.lessonRepo.findAndCount({
      relations: ["group"],
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

  async findGroupAllLessons(groupId: number) {
    const lessons = await this.lessonRepo.find({
      where: { group: { id: groupId } },
      relations: ["group", "room"],
      order: { id: "ASC" },
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
      relations: ["group", "room"],
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
}
