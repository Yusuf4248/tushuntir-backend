import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Attendance } from "../../attendance/entities/attendance.entity";
import { HomeworkSubmission } from "../../modules/homework/homework-submissions/entities/homework-submission.entity";
import { Grade } from "../../modules/daily/grades/entities/grade.entity";
import { ExamResult } from "../../modules/assessment/exam-results/entities/exam-result.entity";
import { ClassStudent } from "../../modules/school/class-students/entities/class-student.entity";

@Entity("student")
export class Student {
  @ApiProperty({
    example: 1,
    description: "O'quvchining unikal identifikatori",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: "Ali",
    description: "O'quvchining ismi",
  })
  @Column({ type: "varchar" })
  first_name: string;

  @ApiProperty({
    example: "Valiyev",
    description: "O'quvchining familiyasi",
  })
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
    example: true,
    description: "Holati: faol yoki nofaol",
  })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({
    example: "male",
    description: "Jinsi: faqat 'male' yoki 'female'",
  })
  @Column({
    type: "enum",
    enum: ["male", "female"],
  })
  gender: "male" | "female";

  @ApiProperty({
    example: "2005-06-15",
    description: "Tug'ilgan sana (YYYY-MM-DD)",
  })
  @Column({ type: "date" })
  date_of_birth: Date;

  @ApiProperty({
    example: "https://example.com/uploads/avatar.jpg",
    description: "Profil rasmi uchun URL",
  })
  @Column({ nullable: true })
  avatar_url: string;

  @Column({ type: "varchar", nullable: true })
  refersh_token_hash: string;

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendance: Attendance[];

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.student)
  classStudents: ClassStudent[];

  @OneToMany(
    () => HomeworkSubmission,
    (homework_submission) => homework_submission.student
  )
  homework_submission: HomeworkSubmission[];

  @OneToMany(() => Grade, (grades) => grades.student)
  grades: Grade[];

  @OneToMany(() => ExamResult, (exam_result) => exam_result.student)
  exam_result: ExamResult[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
