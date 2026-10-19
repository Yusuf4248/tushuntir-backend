import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { CrudOptions, CrudService } from "../../../common/crud/crud.service";
import { UserRole } from "../../../common/enums";
import { School } from "../../school/schools/entities/school.entity";
import { UserQueryDto } from "./dto/user-query.dto";
import { User } from "./entities/user.entity";

export const BCRYPT_ROUNDS = 10;

type Data = Record<string, unknown>;

@Injectable()
export class UsersService extends CrudService<User> {
  protected readonly options: CrudOptions = {
    label: "User",
    relations: ["school"],
    filters: {
      schoolId: "schoolId",
      role: "role",
      isActive: "isActive",
    },
    sortable: ["id", "firstName", "lastName", "lastLoginAt", "createdAt"],
    references: {
      schoolId: { entity: () => School, label: "School" },
    },
  };

  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /** Admin reset of a user's password. Also ends the user's refresh session. */
  async setPassword(
    id: number,
    password: string,
    user: AuthUser,
  ): Promise<void> {
    await this.findOne(id, user);
    await this.repository.update(id, {
      passwordHash: await this.hashPassword(password),
      refreshTokenHash: null,
    });
  }

  protected applyFilters(
    qb: SelectQueryBuilder<User>,
    query: UserQueryDto,
  ): void {
    if (!query.search) return;
    const pattern = `%${query.search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    qb.andWhere(
      new Brackets((where) =>
        where
          .where("row.firstName ILIKE :search")
          .orWhere("row.lastName ILIKE :search")
          .orWhere("row.phone ILIKE :search")
          .orWhere("row.email ILIKE :search"),
      ),
    ).setParameter("search", pattern);
  }

  protected async beforeCreate(data: Data, user: AuthUser): Promise<Data> {
    if (
      data.role === UserRole.SUPER_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        "Only super_admin can create super_admin users",
      );
    }
    const prepared = await super.beforeCreate(data, user);
    this.assertSchoolMatchesRole(prepared.role as UserRole, prepared.schoolId);
    this.assertHasLogin(prepared.phone, prepared.email);
    if (typeof prepared.email === "string")
      prepared.email = prepared.email.toLowerCase();
    prepared.passwordHash = await this.hashPassword(
      prepared.password as string,
    );
    delete prepared.password;
    return prepared;
  }

  protected async beforeUpdate(
    data: Data,
    existing: User,
    user: AuthUser,
  ): Promise<Data> {
    if (
      data.schoolId !== undefined &&
      data.schoolId !== existing.schoolId &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        "Only super_admin can move a user to another school",
      );
    }
    const pick = <K extends keyof User>(key: K) =>
      (data[key] !== undefined ? data[key] : existing[key]) as User[K];
    this.assertSchoolMatchesRole(existing.role, pick("schoolId"));
    this.assertHasLogin(pick("phone"), pick("email"));
    if (typeof data.email === "string") data.email = data.email.toLowerCase();
    return data;
  }

  private assertSchoolMatchesRole(role: UserRole, schoolId: unknown): void {
    if (role === UserRole.SUPER_ADMIN && schoolId != null) {
      throw new BadRequestException(
        "A super_admin must not belong to a school (schoolId must be empty)",
      );
    }
    if (role !== UserRole.SUPER_ADMIN && schoolId == null) {
      throw new BadRequestException(
        `A ${role} must belong to a school (schoolId is required)`,
      );
    }
  }

  private assertHasLogin(phone: unknown, email: unknown): void {
    if (!phone && !email) {
      throw new BadRequestException(
        "A user needs a phone or an email to log in",
      );
    }
  }
}
