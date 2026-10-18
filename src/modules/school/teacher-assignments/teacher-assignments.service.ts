import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TeacherAssignment } from "./entities/teacher-assignment.entity";
import { CreateTeacherAssignmentDto } from "./dto/create-teacher-assignment.dto";
import { UpdateTeacherAssignmentDto } from "./dto/update-teacher-assignment.dto";
import { SchoolClass } from "../classes/entities/school-class.entity";
import { Teacher } from "../../identity/teacher/entities/teacher.entity";

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    @InjectRepository(TeacherAssignment)
    private readonly teacherAssignmentRepository: Repository<TeacherAssignment>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>
  ) {}

  async create(
    createTeacherAssignmentDto: CreateTeacherAssignmentDto
  ): Promise<TeacherAssignment[]> {
    const { classId, teacherId, status, start_date } = createTeacherAssignmentDto;

    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) throw new NotFoundException("Class not found");

    const results: TeacherAssignment[] = [];

    for (const id of teacherId) {
      const teacher = await this.teacherRepository.findOne({ where: { id } });
      if (!teacher)
        throw new NotFoundException(`Teacher with ID ${id} not found`);

      const existingRelation = await this.teacherAssignmentRepository.findOne({
        where: { schoolClass: { id: classId }, teacher: { id } },
      });

      if (existingRelation) {
        throw new BadRequestException(
          `Teacher with ID ${id} is already assigned to this class`
        );
      }

      const newRelation = this.teacherAssignmentRepository.create({
        schoolClass,
        teacher,
        status: status ?? true,
        start_date: start_date ?? schoolClass.start_date,
        end_date: schoolClass.end_date,
      });

      const saved = await this.teacherAssignmentRepository.save(newRelation);
      results.push(saved);
    }

    return results;
  }

  findAll(): Promise<TeacherAssignment[]> {
    return this.teacherAssignmentRepository.find({
      relations: ["schoolClass", "teacher"],
      order: {
        id: "ASC",
      },
    });
  }

  async findOne(id: number): Promise<TeacherAssignment> {
    const teacherAssignment = await this.teacherAssignmentRepository.findOne({
      where: { id },
      relations: ["schoolClass", "teacher"],
      order: {
        id: "ASC",
      },
    });
    if (!teacherAssignment) throw new NotFoundException("TeacherAssignment not found");
    return teacherAssignment;
  }

  async update(
    id: number,
    updateDto: UpdateTeacherAssignmentDto
  ): Promise<TeacherAssignment> {
    const teacherAssignment = await this.teacherAssignmentRepository.findOneBy({ id });
    if (!teacherAssignment) throw new NotFoundException("TeacherAssignment not found");

    if (updateDto.classId) {
      const schoolClass = await this.classRepository.findOneBy({
        id: updateDto.classId,
      });
      if (!schoolClass) throw new NotFoundException("Class not found");
      teacherAssignment.schoolClass = schoolClass;
    }

    if (updateDto.teacherId) {
      const teacher = await this.teacherRepository.findOneBy({
        id: updateDto.teacherId,
      });
      if (!teacher) throw new NotFoundException("Teacher not found");
      teacherAssignment.teacher = teacher;
    }

    return this.teacherAssignmentRepository.save(teacherAssignment);
  }

  async remove(
    classId: number,
    teacherId: number
  ): Promise<{ message: string }> {
    const result = await this.teacherAssignmentRepository.delete({
      schoolClass: { id: classId },
      teacher: { id: teacherId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `TeacherAssignment with classId=${classId} and teacherId=${teacherId} not found`
      );
    }

    return { message: "TeacherAssignment deleted successfully" };
  }

  async deactivateTeacher(id: number): Promise<TeacherAssignment> {
    const teacherAssignment = await this.findOne(id);
    teacherAssignment.status = false;
    return await this.teacherAssignmentRepository.save(teacherAssignment);
  }

  async activateTeacher(id: number): Promise<TeacherAssignment> {
    const teacherAssignment = await this.findOne(id);
    teacherAssignment.status = true;
    return await this.teacherAssignmentRepository.save(teacherAssignment);
  }

  async findActiveTeachersInClass(classId: number): Promise<TeacherAssignment[]> {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    return await this.teacherAssignmentRepository.find({
      where: {
        schoolClass: { id: classId },
        status: true,
      },
      relations: ["teacher"],
      order: { id: "ASC" },
    });
  }

  async findByClass(classId: number): Promise<TeacherAssignment[]> {
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const teacherAssignments = await this.teacherAssignmentRepository.find({
      where: { schoolClass: { id: classId } },
      relations: ["teacher"],
      order: { id: "ASC" },
    });
    return teacherAssignments;
  }

  async findByTeacher(teacherId: number): Promise<TeacherAssignment[]> {
    const teacher = await this.teacherAssignmentRepository.findOne({
      where: { teacher: { id: teacherId } },
    });
    if (!teacher) {
      throw new NotFoundException(`${teacherId}-teacher has no class`);
    }

    return await this.teacherAssignmentRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ["schoolClass"],
      order: { id: "ASC" },
    });
  }
}
