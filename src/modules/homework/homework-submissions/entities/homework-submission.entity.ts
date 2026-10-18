import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Homework } from "../../homework/entities/homework.entity";
import { Student } from "../../../identity/student/entities/student.entity";
import { Grade } from "../../../daily/grades/entities/grade.entity";

export enum HomeworkStatus {
  QABUL_QILINGAN = "qabul qilingan",
  QAYTARILGAN = "qaytarilgan",
  BAJARILMAGAN = "bajarilmagan",
  KUTAYOTGAN = "kutayotgan",
}

@Entity("homework_submissions")
export class HomeworkSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Homework, (homework) => homework.homework_submission)
  homework: Homework;

  @ManyToOne(() => Student, (student) => student.homework_submission)
  student: Student;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  submitted_at: Date;

  @Column()
  comment: string;

  @Column({
    type: "enum",
    enum: HomeworkStatus,
    enumName: "homework_status_enum",
    default: HomeworkStatus.BAJARILMAGAN,
  })
  status: HomeworkStatus;

  @OneToMany(() => Grade, (grades) => grades.homework_submission)
  grades: Grade[];

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
