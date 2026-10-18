import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { School } from "../../modules/school/schools/entities/school.entity";

@Entity("admin")
export class Admin {
  @ApiProperty({ example: 1, description: "Adminning unikal identifikatori" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Ali", description: "Adminning ismi" })
  @Column({ type: "varchar" })
  first_name: string;

  @ApiProperty({ example: "Valiyev", description: "Adminning familiyasi" })
  @Column({ type: "varchar" })
  last_name: string;

  @ApiProperty({
    example: "ali.valiyev@gmail.com",
    description: "Email manzili (yagona bo'lishi kerak)",
  })
  @Column({ type: "varchar", unique: true })
  email: string;

  @ApiProperty({
    example: "+998901234567",
    description: "Telefon raqami (yagona bo'lishi kerak)",
  })
  @Column({ type: "varchar", unique: true })
  phone: string;

  @ApiProperty({
    example: "$2b$10$hashedValueHere",
    description: "Parolning hashlangan ko'rinishi",
  })
  @Column({ type: "varchar" })
  password_hash: string;

  @ApiProperty({
    example: false,
    description: "Administrator yaratuvchi bo'lib hisoblanadimi",
  })
  @Column({ type: "boolean", default: false, nullable: true })
  is_creator: boolean;

  @ApiProperty({
    example: true,
    description: "Administrator faol yoki faol emasligi",
  })
  @Column({ type: "boolean", default: true, nullable: true })
  is_active: boolean;

  @Column({ type: "varchar", nullable: true })
  refersh_token_hash: string;

  @ManyToMany(() => School, (school) => school.admin, { nullable: true })
  @JoinTable({
    name: "admin_schools",
    joinColumn: { name: "admin_id" },
    inverseJoinColumn: { name: "school_id" },
  })
  school: School[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
