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
import { BranchesService } from "../branches/branches.service";
import { UpdateAdminStatusDto } from "./dto/update-admin-status.dto";
import { Branch } from "../branches/entities/branch.entity";
import { Teacher } from "../teacher/entities/teacher.entity";
import { Student } from "../student/entities/student.entities";
import { Lid } from "../lid/entities/lid.entity";
import { LidService } from "../lid/lid.service";
import { Otp } from "../lid/entities/otp.entity";
import { OtpDto } from "./dto/otp.dto";
import * as bcrypt from "bcrypt";
import { NewPasswordDto } from "./dto/new-password.dto";
import { ForgetPasswordDto } from "./dto/forget-password.dto";
import { Request, Response } from "express";
import { decode } from "../common/helpers/crypto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    @InjectRepository(Branch) private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Lid) private readonly lidRepo: Repository<Lid>,
    @InjectRepository(Otp) private readonly otpRepo: Repository<Otp>,
    private readonly branchService: BranchesService,
    private readonly lidService: LidService
  ) {}
  async create(createAdminDto: CreateAdminDto) {
    const hashshed_password = await bcrypt.hash(
      createAdminDto.password_hash,
      7
    );
    if (createAdminDto.branchId) {
      const branch = await this.branchRepo.find({
        where: { id: In(createAdminDto.branchId) },
      });
      const newAdmin = await this.adminRepo.save({
        ...createAdminDto,
        branch,
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
    const admins = await this.adminRepo.find({ relations: ["branch"] });
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
      relations: ["branch"],
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
      relations: ["branch"],
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

  async addBranch(branchId: number, id: number) {
    await this.findOne(id);
    const { branch } = await this.branchService.findOne(branchId);

    await this.adminRepo.update({ id }, branch);
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
          relations: ["branch"],
        });
      case "teacher":
        return this.teacherRepo.findOne({
          where: { id },
          relations: ["branches", "exam"],
        });
      case "student":
        return this.studentRepo.findOne({
          where: { id },
          relations: ["events"],
        });
      case "lid":
        return this.lidRepo.findOne({ where: { id } });
      default:
        throw new NotFoundException("Role noto'g'ri");
    }
  }

  async forgetPassword(forgetPasswordDto: ForgetPasswordDto, res: Response) {
    var { email, role } = forgetPasswordDto;
    let otp_data: any;
    switch (role) {
      case "admin":
        const admin = await this.adminRepo.findOne({
          where: { email },
        });
        if (!admin) {
          throw new BadRequestException(`Admin with this ${email} not found`);
        }
        otp_data = await this.lidService.generateNewOtp(admin.email, role);
        res.cookie("verification_key", otp_data.verification_key, {
          maxAge: Number(process.env.COOKIE_REFRESH_TIME),
          httpOnly: true,
        });
        return {
          success: true,
          message: otp_data.message,
        };
      case "teacher":
        const teacher = await this.teacherRepo.findOne({
          where: { email },
        });
        if (!teacher) {
          throw new BadRequestException("Something went wrong");
        }
        otp_data = await this.lidService.generateNewOtp(teacher.email, role);
        res.cookie("verification_key", otp_data.verification_key, {
          maxAge: Number(process.env.COOKIE_REFRESH_TIME),
          httpOnly: true,
        });
        return {
          success: true,
          message: otp_data.message,
        };
      case "student":
        const student = await this.studentRepo.findOne({
          where: { email },
        });
        if (!student) {
          throw new BadRequestException("Something went wrong");
        }
        otp_data = await this.lidService.generateNewOtp(student.email, role);
        res.cookie("verification_key", otp_data.verification_key, {
          maxAge: Number(process.env.COOKIE_REFRESH_TIME),
          httpOnly: true,
        });
        return {
          success: true,
          message: otp_data.message,
        };
      case "lid":
        const lid = await this.lidRepo.findOne({
          where: { email },
        });
        if (!lid) {
          throw new BadRequestException("Something went wrong");
        }
        otp_data = await this.lidService.generateNewOtp(lid.email, role);
        res.cookie("verification_key", otp_data.verification_key, {
          maxAge: Number(process.env.COOKIE_REFRESH_TIME),
          httpOnly: true,
        });
        return {
          success: true,
          message: otp_data.message,
        };
      default:
        throw new NotFoundException("Role noto'g'ri");
    }
  }

  async verifyOtp(verifyOtpDto: OtpDto, req: Request) {
    const verificationKey = req.cookies.verification_key;
    const decodedVerificationKey = await decode(verificationKey);
    const parsedOtpPayload = JSON.parse(decodedVerificationKey);
    const { otp } = verifyOtpDto;
    const otp_details = await this.otpRepo.findOne({
      order: { created_at: "DESC" },
      where: { email: parsedOtpPayload.email },
    });
    if (!otp_details) {
      throw new BadRequestException("To this email never send");
    }
    const currentDate = new Date();
    if (otp_details.verified) {
      throw new BadRequestException("This otp has been previously verified.");
    }
    if (otp_details.expiration_time < currentDate) {
      throw new BadRequestException("This OTP has expired.");
    }
    if (+otp_details.otp !== otp) {
      throw new BadRequestException("Invalid OTP");
    }
    await this.otpRepo.update({ id: otp_details.id }, { verified: true });

    return {
      message: "Congratulations, now enter new password",
    };
  }

  async newPassword(dto: NewPasswordDto, req: Request, res: Response) {
    const { confirm_password, password } = dto;
    if (confirm_password !== password) {
      throw new BadRequestException("Passwords do not match");
    }
    const verificationKey = req.cookies.verification_key;
    const decodedVerificationKey = await decode(verificationKey);
    const parsedOtpPayload = JSON.parse(decodedVerificationKey);
    switch (parsedOtpPayload.role) {
      case "admin":
        const admin = await this.adminRepo.findOne({
          where: { email: parsedOtpPayload.email },
        });
        admin!.password_hash = password;
        res.clearCookie("verification_key");
        return {
          success: true,
          message: "Your password successfully changed!",
        };
      case "teacher":
        const teacher = await this.teacherRepo.findOne({
          where: { email: parsedOtpPayload.email },
        });
        teacher!.password = password;
        res.clearCookie("verification_key");
        return {
          success: true,
          message: "Your password successfully changed!",
        };
      case "student":
        const student = await this.studentRepo.findOne({
          where: { email: parsedOtpPayload.email },
        });
        student!.password_hash = password;
        res.clearCookie("verification_key");
        return {
          success: true,
          message: "Your password successfully changed!",
        };
      case "lid":
        const lid = await this.lidRepo.findOne({
          where: { email: parsedOtpPayload.email },
        });
        lid!.password_hash = password;
        res.clearCookie("verification_key");
        return {
          success: true,
          message: "Your password successfully changed!",
        };
      default:
        throw new BadRequestException("Something went wrong");
    }
  }
}
