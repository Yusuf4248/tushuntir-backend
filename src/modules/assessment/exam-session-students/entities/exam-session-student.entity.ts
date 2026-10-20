import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { ExamSession } from "../../exam-sessions/entities/exam-session.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Unique("UQ_exam_session_students_session_student", [
  "examSessionId",
  "studentId",
])
@SchoolScope({ via: "examSession", target: () => ExamSession })
@Entity("exam_session_students")
export class ExamSessionStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "exam_session_id", type: "int" })
  examSessionId: number;

  @ManyToOne(() => ExamSession, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "exam_session_id" })
  examSession: ExamSession;

  @Index("IDX_exam_session_students_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "seat", type: "varchar", length: 16, nullable: true })
  seat: string | null;

  @Column({ name: "status", type: "varchar", nullable: true })
  status: string | null;
}
