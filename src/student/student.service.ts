import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { Student } from "./entities/student.entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { FileService } from "../shared/file/file.service";
import { SchoolClass } from "../modules/school/classes/entities/school-class.entity";
import { Response } from "express";
import { Homework } from "../modules/homework/homework/entities/homework.entity";
import * as path from "path";
import * as bcrypt from "bcrypt";
import { Media } from "../modules/homework/media/entities/media.entity";
import { HomeworkSubmission } from "../modules/homework/homework-submissions/entities/homework-submission.entity";

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Homework)
    private readonly homeworkRepo: Repository<Homework>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(HomeworkSubmission)
    private readonly homeworkSubmissionRepo: Repository<HomeworkSubmission>,
    private readonly fileService: FileService
  ) {}
  async create(createStudentDto: CreateStudentDto) {
    const { password_hash } = createStudentDto;

    const hashed_password = await bcrypt.hash(password_hash, 7);

    const newStudent = await this.studentRepo.save({
      ...createStudentDto,
      password_hash: hashed_password,
    });

    return {
      message: "Student successfully created!",
      success: true,
      newStudent,
    };
  }

  async findAll(page: number, limit: number) {
    const [students, total] = await this.studentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "ASC" },
    });
    return {
      success: true,
      total,
      page,
      limit,
      data: students,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    const student = await this.studentRepo.findOne({
      where: { id },
    });
    if (!student) {
      throw new BadRequestException(`student with ${id}-id not fount`);
    }
    return {
      message: `${id}-student`,
      success: true,
      student,
    };
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id);
    await this.studentRepo.update({ id }, updateStudentDto);

    const student = await this.findOne(id);
    return {
      message: "Student data updated",
      success: true,
      student,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.studentRepo.delete({ id });
    return {
      message: `${id}-id student deleted`,
      success: true,
    };
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const { old_password, password, confirm_password } = changePasswordDto;
    if (password !== confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }
    const student = await this.studentRepo.findOneBy({ id });
    if (!student) {
      throw new NotFoundException("Student not found");
    }
    const oldValidPassword = await bcrypt.compare(
      old_password,
      student.password_hash
    );
    if (!oldValidPassword) {
      throw new BadRequestException("Old password is incorrect");
    }

    student.password_hash = await bcrypt.hash(password, 7);
    await this.studentRepo.save(student);

    return { message: "Password successfully changed", new_pass: password };
  }

  async findByEmail(email: string) {
    return this.studentRepo.findOneBy({ email });
  }

  async updateTokenHash(id: number, hash: string) {
    await this.studentRepo.update(id, { refersh_token_hash: hash });
  }

  async uploadAvatar(studentId: number, file: Express.Multer.File) {
    try {
      const { student } = await this.findOne(studentId);

      const file_path = path.resolve(
        __dirname,
        "..",
        "..",
        "static",
        "student"
      );

      const fileName = await this.fileService.saveFile(file, file_path);

      student.avatar_url = `https://erp-edu.uz/static/student/${fileName}`;
      const updated = await this.studentRepo.save(student);

      return {
        message: "Avatar muvaffaqiyatli yuklandi",
        data: updated.avatar_url,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        "Avatar yuklashda xatolik yuz berdi"
      );
    }
  }

  async viewAvatar(id: number, res: Response) {
    const { student } = await this.findOne(id);

    if (!student || !student.avatar_url) {
      throw new NotFoundException("Avatar topilmadi");
    }

    const avatarPath = path.join(
      __dirname,
      "..",
      "..",
      "static",
      "student",
      student.avatar_url
    );

    res.sendFile(avatarPath);
  }

  // async findStudentAllClasses(id: number) {
  //   const { student } = await this.findOne(id);
  //   if (student.classes.length == 0) {
  //     throw new NotFoundException("The student has no schoolClass.");
  //   }
  //   const classes = student.classes.map((schoolClass) => ({
  //     name: schoolClass.name,
  //     subject: schoolClass.subject.title,
  //     start_date: schoolClass.start_date,
  //     end_date: schoolClass.end_date,
  //     status: schoolClass.status,
  //   }));
  //   return {
  //     classes,
  //   };
  // }

  // async getStudentHomeworksByClass(
  //   studentId: number,
  //   classId: number,
  //   page: number,
  //   limit: number,
  //   status: HomeworkStatus
  // ) {
  //   if (!Number.isInteger(Number(classId)) || Number(classId) <= 0)
  //     throw new BadRequestException(
  //       "ID must be integer and must be greater than zero"
  //     );
  //   const schoolClass = await this.classRepo.findOne({
  //     where: { id: classId },
  //     relations: ["students"],
  //   });
  //   if (!schoolClass) {
  //     throw new NotFoundException(`${classId}-schoolClass not found`);
  //   }
  //   const isStudentExist = schoolClass.students.some(
  //     (student) => student.id == studentId
  //   );

  //   if (!isStudentExist) {
  //     throw new ForbiddenException(
  //       `${studentId}-student not found in this schoolClass`
  //     );
  //   }
  //   if (page <= 0 || limit <= 0)
  //     throw new BadRequestException("Page and limit must be greater than zero");
  //   const skip = (page - 1) * limit;

  //   if (!status) {
  //     const [homeworks, total] = await this.homeworkRepo.findAndCount({
  //       relations: ["teacher", "schoolClass"],
  //       skip,
  //       take: limit,
  //       order: { id: "DESC" },
  //     });
  //     if (homeworks.length == 0) {
  //       throw new NotFoundException("Homework not found");
  //     }

  //     return {
  //       success: true,
  //       total,
  //       page,
  //       limit,
  //       homeworks,
  //     };
  //   } else {
  //     const [homeworks, total] = await this.homeworkSubmissionRepo.findAndCount(
  //       {
  //         where: {
  //           student: { id: studentId },
  //           homework: { schoolClass: { id: classId } },
  //           status: status,
  //         },
  //         relations: ["homework", "homework.schoolClass", "homework.teacher"],
  //         skip,
  //         take: limit,
  //         order: { id: "DESC" },
  //       }
  //     );

  //     if (homeworks.length == 0) {
  //       throw new NotFoundException("Homework not found");
  //     }

  //     return {
  //       success: true,
  //       total,
  //       page,
  //       limit,
  //       status,
  //       homeworks,
  //     };
  //   }
  // }
}
