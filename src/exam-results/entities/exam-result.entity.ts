import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exam } from "../../exams/entities/exam.entity";
import { Student } from "../../student/entities/student.entities";
import { ApiProperty } from "@nestjs/swagger";

@Entity("exam-results")
export class ExamResult {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 87 })
  @Column()
  score: number;

  @ApiProperty({ example: 100 })
  @Column()
  max_score: number;

  @ApiProperty({ example: "2025-05-31T00:00:00.000Z" })
  @Column()
  date: Date;

  @ApiProperty({ type: () => Exam })
  @ManyToOne(() => Exam, (exam) => exam.exam_result)
  exam: Exam;

  @ApiProperty({ type: () => Student })
  @ManyToOne(() => Student, (student) => student.exam_result)
  student: Student;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
