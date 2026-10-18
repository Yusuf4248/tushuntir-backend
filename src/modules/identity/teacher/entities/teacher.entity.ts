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
import { Homework } from "../../../homework/homework/entities/homework.entity";
import { Grade } from "../../../daily/grades/entities/grade.entity";
import { ExamSession } from "../../../assessment/exam-sessions/entities/exam-session.entity";
import { School } from "../../../school/schools/entities/school.entity";
import { TeacherAssignment } from "../../../school/teacher-assignments/entities/teacher-assignment.entity";

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

  @OneToMany(() => TeacherAssignment, (teacherAssignment) => teacherAssignment.teacher)
  @ApiProperty({ type: () => TeacherAssignment })
  teacherAssignments: TeacherAssignment[];

  @OneToMany(() => Homework, (homework) => homework.teacher)
  homework: Homework[];

  @OneToMany(() => Grade, (grades) => grades.teacher)
  grades: Grade[];

  @ManyToMany(() => ExamSession, (examSession) => examSession.teacher, { nullable: true })
  examSessions: ExamSession[];

  @ManyToMany(() => School, (school) => school.teachers, { cascade: true })
  @JoinTable({
    name: "teacher_schools",
    joinColumn: { name: "teacher_id" },
    inverseJoinColumn: { name: "school_id" },
  })
  schools: School[];
}
