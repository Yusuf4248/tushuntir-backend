import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { UpdateTeacherDto } from "./dto/update-teacher.dto";
import { Teacher } from "./entities/teacher.entity";
import { ChangePasswordDto } from "../student/dto/change-password.dto";
import { Branch } from "../branches/entities/branch.entity";
import { FileService } from "../file/file.service";
import * as bcrypt from "bcrypt";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly fileService: FileService
  ) {}
  async create(createTeacherDto: CreateTeacherDto) {
    let branches: Branch[] = [];
    const hashshed_password = await bcrypt.hash(createTeacherDto.password, 7);

    if (
      Array.isArray(createTeacherDto.branchId) &&
      createTeacherDto.branchId.length > 0
    ) {
      branches = await this.branchRepo.find({
        where: { id: In(createTeacherDto.branchId) },
      });
    }

    const newTeacher = await this.teacherRepo.save({
      ...createTeacherDto,
      password: hashshed_password,
      branches,
    });
    return {
      message: "Teacher created successfully",
      success: true,
      newTeacher,
    };
  }

  async findAll(page: number, limit: number) {
    const [teachers, total] = await this.teacherRepo.findAndCount({
      relations: ["exam", "branches"],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "ASC" },
    });
    return {
      success: true,
      total,
      data: teachers,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new BadRequestException(
        "ID must be integer and must be greater than zero"
      );
    }
    const teacher = await this.teacherRepo.findOne({
      where: { id },
      relations: ["exam", "branches"],
    });
    if (!teacher) {
      throw new BadRequestException(`teacher with ${id}-id not found`);
    }
    return {
      message: `${id}-teacher`,
      success: true,
      teacher,
    };
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.teacherRepo.findOne({
      where: { id },
      relations: ["branches"],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${id} not found`);
    }

    // DTO dan branchId va qolgan fieldlarni ajratib olamiz
    const { branchId, ...restDto } = updateTeacherDto;

    // Qolgan fieldlarni yangilaymiz
    Object.assign(teacher, restDto);

    // Branchlar bilan bog‘liq aloqani yangilaymiz
    if (branchId) {
      if (!Array.isArray(branchId)) {
        throw new BadRequestException("branchId must be an array");
      }

      const branches = await this.branchRepo.findBy({
        id: In(branchId),
      });

      teacher.branches = branches;
    } else {
      // Agar branchId yo‘q bo‘lsa, mavjud aloqalarni tozalaymiz
      teacher.branches = [];
    }

    // O'zgarishlarni saqlaymiz
    const updated = await this.teacherRepo.save(teacher);

    return {
      message: "Teacher data updated",
      success: true,
      teacher: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.teacherRepo.delete(id);

    return {
      message: `${id}-teacher deleted`,
      success: true,
    };
  }

  async findByEmail(email: string) {
    return this.teacherRepo.findOneBy({ email });
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const { old_password, password, confirm_password } = changePasswordDto;
    if (password !== confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }
    const teacher = await this.teacherRepo.findOneBy({ id });
    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }
    const oldValidPassword = await bcrypt.compare(
      old_password,
      teacher.password
    );
    if (!oldValidPassword) {
      throw new BadRequestException("Old password is incorrect");
    }

    teacher.password = await bcrypt.hash(password, 7);
    await this.teacherRepo.save(teacher);

    return {
      message: "Password successfully changed",
      success: true,
      new_pass: password,
    };
  }

  async updateTokenHash(id: number, hash: string) {
    await this.teacherRepo.update(id, { refersh_token_hash: hash });
  }

  async uploadAvatar(id: number, file: Express.Multer.File) {
    try {
      const teacher = this.findOne(id);

      const file_path = path.resolve(
        __dirname,
        "..",
        "..",
        "static",
        "teacher"
      );
      const fileName = await this.fileService.saveFile(file, file_path);

      (await teacher).teacher.avatar_url = fileName;
      const updated = await this.teacherRepo.save((await teacher).teacher);

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
    const { teacher } = await this.findOne(id);
    if (!teacher || !teacher.avatar_url) {
      throw new BadRequestException("Avatar topilmadi");
    }

    const avatarPath = path.join(
      __dirname,
      "..",
      "..",
      "static",
      "teacher",
      teacher.avatar_url
    );

    if (!fs.existsSync(avatarPath)) {
      throw new BadRequestException("Fayl mavjud emas");
    }

    res.sendFile(avatarPath);
  }
}
