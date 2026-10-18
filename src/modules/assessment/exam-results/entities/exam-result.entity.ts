import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ExamSession } from "../../exam-sessions/entities/exam-session.entity";
import { Student } from "../../../identity/student/entities/student.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("exam_results")
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

  @ApiProperty({ type: () => ExamSession })
  @ManyToOne(() => ExamSession, (examSession) => examSession.examResults)
  @JoinColumn({ name: "exam_session_id" })
  examSession: ExamSession;

  @ApiProperty({ type: () => Student })
  @ManyToOne(() => Student, (student) => student.exam_result)
  @JoinColumn({ name: "student_id" })
  student: Student;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
