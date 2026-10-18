import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Student } from "../../student/entities/student.entities";
import { HomeworkSubmission } from "../../modules/homework/homework-submissions/entities/homework-submission.entity";
import { Teacher } from "../../teacher/entities/teacher.entity";

@Entity("grades")
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (student) => student.grades)
  student: Student;

  @ManyToOne(
    () => HomeworkSubmission,
    (homework_submission) => homework_submission.grades
  )
  homework_submission: HomeworkSubmission;

  @ManyToOne(() => Teacher, (teacher) => teacher.grades)
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
