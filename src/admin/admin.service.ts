import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Admin } from "./entities/admin.entity";
import { In, Repository } from "typeorm";
import { ChangePasswordDto } from "../student/dto/change-password.dto";
import { SchoolsService } from "../modules/school/schools/schools.service";
import { UpdateAdminStatusDto } from "./dto/update-admin-status.dto";
import { School } from "../modules/school/schools/entities/school.entity";
import { Teacher } from "../teacher/entities/teacher.entity";
import { Student } from "../student/entities/student.entities";
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly schoolService: SchoolsService
  ) {}
  async create(createAdminDto: CreateAdminDto) {
    const hashshed_password = await bcrypt.hash(
      createAdminDto.password_hash,
      7
    );
    if (createAdminDto.schoolIds) {
      const school = await this.schoolRepo.find({
        where: { id: In(createAdminDto.schoolIds) },
      });
      const newAdmin = await this.adminRepo.save({
        ...createAdminDto,
        school,
        password_hash: hashshed_password,
      });
      return {
        Message: "New Admin Created",
        success: true,
        newAdmin,
      };
    } else {
      const newAdmin = await this.adminRepo.save({
        ...createAdminDto,
        password_hash: hashshed_password,
      });
      return {
        Message: "New Admin Created",
        success: true,
        newAdmin,
      };
    }
  }

  async findAll() {
    const admins = await this.adminRepo.find({ relations: ["school"] });
    return {
      success: true,
      admins,
    };
  }

  async findOne(id: number) {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException();
    // "ID must be integer and must be greater than zero"
    const admin = await this.adminRepo.findOne({
      where: { id },
      relations: ["school"],
    });
    if (!admin) {
      throw new BadRequestException(`Admin with id-${id} not found`);
    }
    return {
      message: `Admin-${id}`,
      success: true,
      admin,
    };
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    await this.findOne(id);
    await this.adminRepo.update({ id }, updateAdminDto);

    const admin = await this.adminRepo.findOne({
      where: { id },
      relations: ["school"],
    });
    return {
      message: "Admin data updated",
      success: true,
      admin,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.adminRepo.delete({ id });

    return {
      message: `${id}-admin deleted`,
      success: true,
    };
  }

  async findByEmail(email: string) {
    return this.adminRepo.findOneBy({ email });
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const { old_password, password, confirm_password } = changePasswordDto;
    if (password !== confirm_password) {
      throw new BadRequestException("Passwords do not match");
    }
    const admin = await this.adminRepo.findOneBy({ id });
    if (!admin) {
      throw new NotFoundException("admin not found");
    }
    const oldValidPassword = await bcrypt.compare(
      old_password,
      admin.password_hash
    );
    if (!oldValidPassword) {
      throw new BadRequestException("Old password is incorrect");
    }

    admin.password_hash = await bcrypt.hash(password, 7);
    await this.adminRepo.save(admin);

    return { message: "Password successfully changed", new_pass: password };
  }

  async updateTokenHash(id: number, hash: string) {
    await this.adminRepo.update(id, { refersh_token_hash: hash });
  }

  async updateStatus(id: number, dto: UpdateAdminStatusDto) {
    await this.adminRepo.findOne({ where: { id } });

    if (!("is_creator" in dto) && !("is_active" in dto)) {
      throw new BadRequestException(
        "Hech qanday o'zgaruvchan maydon yuborilmadi (is_creator yoki is_active)"
      );
    }

    await this.adminRepo.update({ id }, dto);

    const new_data = await this.adminRepo.findOne({ where: { id } });

    return {
      message: "Admin holati muvaffaqiyatli yangilandi",
      new_data,
    };
  }

  async addSchool(schoolId: number, id: number) {
    await this.findOne(id);
    const { school } = await this.schoolService.findOne(schoolId);

    await this.adminRepo.update({ id }, school);
    const admin = await this.findOne(id);
    return {
      message: "Updated",
      success: true,
      admin,
    };
  }

  async getUniversalProfile(id: number, role: string) {
    switch (role) {
      case "admin":
        return await this.adminRepo.findOne({
          where: { id },
          relations: ["school"],
        });
      case "teacher":
        return this.teacherRepo.findOne({
          where: { id },
          relations: ["schools", "exam"],
        });
      case "student":
        return this.studentRepo.findOne({
          where: { id },
        });
      default:
        throw new NotFoundException("Role noto'g'ri");
    }
  }
}
