import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateExamSessionDto } from "./dto/create-exam-session.dto";
import { UpdateExamSessionDto } from "./dto/update-exam-session.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { ExamSession } from "./entities/exam-session.entity";
import { In, Repository } from "typeorm";
import { ClassesService } from "../../school/classes/classes.service";
import { RoomsService } from "../../school/rooms/rooms.service";
import { Teacher } from "../../../teacher/entities/teacher.entity";

@Injectable()
export class ExamSessionsService {
  constructor(
    @InjectRepository(ExamSession) private readonly examSessionRepo: Repository<ExamSession>,
    private readonly classesService: ClassesService,
    private readonly roomService: RoomsService,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>
  ) {}
  async create(createExamSessionDto: CreateExamSessionDto) {
    let teacher: Teacher[] = [];
    const { schoolClass } = await this.classesService.findOne(createExamSessionDto.classId);
    const { room } = await this.roomService.findOne(createExamSessionDto.roomId);
    if (createExamSessionDto.teacherId) {
      teacher = await this.teacherRepo.find({
        where: { id: In(createExamSessionDto.teacherId) },
      });
    }
    const newExamSession = await this.examSessionRepo.save({
      ...createExamSessionDto,
      schoolClass,
      room,
      teacher,
    });
    return {
      message: "New exam created!",
      success: true,
      newExamSession,
    };
  }

  async findAll() {
    const examSessions = await this.examSessionRepo.find({
      relations: ["schoolClass", "room", "teacher"],
    });
    return {
      message: "All exams",
      success: true,
      examSessions,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    const examSession = await this.examSessionRepo.findOne({
      where: { id },
      relations: ["schoolClass", "room", "teacher"],
    });
    if (!examSession) {
      throw new NotFoundException(`${id}-exam not found`);
    }
    return {
      message: `${id}-exam`,
      success: true,
      examSession,
    };
  }

  async update(id: number, updateExamSessionDto: UpdateExamSessionDto) {
    await this.findOne(id);
    await this.examSessionRepo.update({ id }, updateExamSessionDto);
    const { examSession } = await this.findOne(id);

    return {
      message: `${id}-exam data updated!`,
      success: true,
      examSession,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.examSessionRepo.delete(id);

    return {
      message: `${id}-exam deleted!`,
      success: true,
    };
  }
}
