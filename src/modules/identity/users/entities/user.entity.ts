import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserRole } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { School } from "../../../school/schools/entities/school.entity";

@SchoolScope({ column: "schoolId" })
@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "school_id", type: "int", nullable: true })
  schoolId: number | null;

  @ManyToOne(() => School, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "school_id" })
  school: School | null;

  @Column({ name: "role", type: "enum", enum: UserRole, enumName: "user_role" })
  role: UserRole;

  @Column({ name: "first_name", type: "varchar" })
  firstName: string;

  @Column({ name: "last_name", type: "varchar" })
  lastName: string;

  @Column({
    name: "phone",
    type: "varchar",
    length: 32,
    nullable: true,
    unique: true,
  })
  phone: string | null;

  @Column({ name: "email", type: "varchar", nullable: true, unique: true })
  email: string | null;

  @Column({ name: "password_hash", type: "varchar", select: false })
  passwordHash: string;

  @Column({ name: "language", type: "varchar", nullable: true, default: "uz" })
  language: string | null;

  @Column({ name: "is_active", type: "boolean", nullable: true, default: true })
  isActive: boolean | null;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt: Date | null;

  @Column({
    name: "refresh_token_hash",
    type: "varchar",
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
