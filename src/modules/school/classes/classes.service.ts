import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateSchoolClassDto } from "./dto/create-school-class.dto";
import { UpdateSchoolClassDto } from "./dto/update-school-class.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { SchoolClass } from "./entities/school-class.entity";
import { QueryFailedError, Repository } from "typeorm";
import { SubjectsService } from "../subjects/subjects.service";
import { LessonsService } from "../../../lessons/lessons.service";
import { ClassStudentsService } from "../class-students/class-students.service";
import { GroupTeachersService } from "../../../group-teachers/group-teachers.service";
import { AttendanceService } from "../../../attendance/attendance.service";

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(SchoolClass) private readonly classRepo: Repository<SchoolClass>,
    @Inject(forwardRef(() => LessonsService))
    private readonly lessonService: LessonsService,
    private readonly subjectService: SubjectsService,
    private readonly attendanceService: AttendanceService,
    @Inject(forwardRef(() => ClassStudentsService))
    private readonly classStudentsService: ClassStudentsService,
    @Inject(forwardRef(() => GroupTeachersService))
    private readonly groupTeachersService: GroupTeachersService
  ) {}
  async create(createSchoolClassDto: CreateSchoolClassDto) {
    const { subject } = await this.subjectService.findOne(
      createSchoolClassDto.subjectId
    );

    try {
      const newClass = await this.classRepo.save({
        ...createSchoolClassDto,
        subject,
      });

      const lessons = await this.lessonService.createAllLessons({
        roomId: newClass.roomId,
        classId: newClass.id,
      });

      const newClass1 = await this.classRepo.findOne({
        where: { id: newClass.id },
        relations: ["subject"],
      });

      return {
        message: "New class created successfully!",
        success: true,
        newClass: newClass1,
        lessons,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === "23505"
      ) {
        throw new ConflictException("Class name already exists");
      }
      throw new InternalServerErrorException(
        "Unexpected error during class creation"
      );
    }
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [classes, total] = await this.classRepo.findAndCount({
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
      data: classes,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    const schoolClass = await this.classRepo.findOne({
      where: { id },
      relations: ["subject", "lessons", "groupTeachers", "classStudents"],
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class ID-${id} not found`);
    }
    const room = schoolClass.lessons[0].room;
    return {
      message: `Class ID-${id}`,
      success: true,
      schoolClass,
      room,
    };
  }

  async update(id: number, updateSchoolClassDto: UpdateSchoolClassDto) {
    await this.findOne(id);
    await this.classRepo.update({ id }, updateSchoolClassDto);

    const schoolClass = await this.findOne(id);
    return {
      message: `Class ID-${id} data updated`,
      success: true,
      schoolClass,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.classRepo.delete({ id });
    return {
      message: `Class id-${id} deleted`,
      success: true,
    };
  }

  async getClassByName(class_name: string) {
    if (!class_name?.trim()) {
      throw new BadRequestException("Guruh nomi bo'sh bo'lishi mumkin emas");
    }
    const schoolClass = await this.classRepo.findOne({
      where: { name: class_name },
      relations: ["students", "teachers", "subject"],
    });
    if (!schoolClass) {
      throw new NotFoundException(
        `${class_name} class not found. Plese check class name and try again.`
      );
    }
    return schoolClass;
  }

  async findOneClassForTeacher(id: number) {
    const schoolClass = await this.findOne(id);
    await this.lessonService.completeExpiredLessons();
    const groupTeachers = await this.groupTeachersService.findByClass(id);
    const classStudents = await this.classStudentsService.findByClass(id);
    const { lessons } = await this.lessonService.findClassAllLessons(id);
    const newDate = new Date();
    const data = await this.attendanceService.isLessonAttendedByDate(
      id,
      newDate
    );

    return {
      message: `${id}-schoolClass`,
      schoolClass: schoolClass.schoolClass,
      room: schoolClass.room,
      groupTeachers,
      classStudents,
      lessons,
      data,
    };
  }
}
