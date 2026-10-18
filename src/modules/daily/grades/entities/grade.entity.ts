import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Student } from "../../../identity/student/entities/student.entity";
import { HomeworkSubmission } from "../../../homework/homework-submissions/entities/homework-submission.entity";
import { Teacher } from "../../../identity/teacher/entities/teacher.entity";

@Entity("grades")
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (student) => student.grades)
  @JoinColumn({ name: "student_id" })
  student: Student;

  @ManyToOne(
    () => HomeworkSubmission,
    (homework_submission) => homework_submission.grades
  )
  @JoinColumn({ name: "homework_submission_id" })
  homework_submission: HomeworkSubmission;

  @ManyToOne(() => Teacher, (teacher) => teacher.grades)
  @JoinColumn({ name: "teacher_id" })
  teacher: Teacher;

  @Column()
  grade: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: Date;

  @Column()
  comment: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
