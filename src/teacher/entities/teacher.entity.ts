import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Homework } from "../../homeworks/entities/homework.entity";
import { Grade } from "../../grades/entities/grade.entity";
import { Exam } from "../../exams/entities/exam.entity";
import { School } from "../../modules/school/schools/entities/school.entity";
import { GroupTeacher } from "../../group-teachers/entities/group-teacher.entity";

@Entity("teacher")
export class Teacher {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Ali" })
  @Column({ type: "varchar" })
  first_name: string;

  @ApiProperty({ example: "Valiyev" })
  @Column({ type: "varchar" })
  last_name: string;

  @ApiProperty({ example: "ali@example.com" })
  @Column({ type: "varchar", unique: true })
  email: string;

  @ApiProperty({ example: "hashed_password" })
  @Column({ type: "varchar" })
  password: string;

  @ApiProperty({ example: "+998901234567" })
  @Column({ type: "varchar", unique: true })
  phone: string;

  @Column({ name: "school_ids", type: "int", array: true, nullable: true })
  schoolIds: number[];

  @ApiProperty({
    example: "main teacher",
    enum: ["assistant teacher", "main teacher"],
  })
  @Column({ type: "enum", enum: ["assistant teacher", "main teacher"] })
  role: "assistant teacher" | "main teacher";

  @ApiProperty({ example: true })
  @Column({ type: "boolean", default: true, nullable: true })
  is_active: boolean;

  @Column({ type: "varchar", nullable: true })
  refersh_token_hash: string;

  @ApiProperty({
    example: "https://example.com/uploads/avatar.jpg",
    description: "Profil rasmi uchun URL",
  })
  @Column({ nullable: true, default: "" })
  avatar_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => GroupTeacher, (groupTeacher) => groupTeacher.teacher)
  @ApiProperty({ type: () => GroupTeacher })
  groupTeachers: GroupTeacher[];

  @OneToMany(() => Homework, (homework) => homework.teacher)
  homework: Homework[];

  @OneToMany(() => Grade, (grades) => grades.teacher)
  grades: Grade[];

  @ManyToMany(() => Exam, (exam) => exam.teacher, { nullable: true })
  exam: Exam[];

  @ManyToMany(() => School, (school) => school.teachers, { cascade: true })
  @JoinTable({
    name: "teacher_schools",
    joinColumn: { name: "teacher_id" },
    inverseJoinColumn: { name: "school_id" },
  })
  schools: School[];
}
