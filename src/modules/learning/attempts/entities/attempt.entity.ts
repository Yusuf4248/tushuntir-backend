import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttemptMode } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { numberTransformer } from "../../../../common/transforms";
import { ExamSession } from "../../../assessment/exam-sessions/entities/exam-session.entity";
import { Quiz } from "../../quizzes/entities/quiz.entity";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ via: "student", target: () => User })
@Entity("attempts")
export class Attempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_attempts_quiz_id")
  @Column({ name: "quiz_id", type: "int" })
  quizId: number;

  @ManyToOne(() => Quiz, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz;

  @Index("IDX_attempts_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Index("IDX_attempts_exam_session_id")
  @Column({ name: "exam_session_id", type: "int", nullable: true })
  examSessionId: number | null;

  @ManyToOne(() => ExamSession, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "exam_session_id" })
  examSession: ExamSession | null;

  /** home = practice, exam = supervised computer room */
  @Column({
    name: "mode",
    type: "enum",
    enum: AttemptMode,
    enumName: "attempt_mode",
  })
  mode: AttemptMode;

  @Column({
    name: "score_percent",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  scorePercent: number | null;

  @Column({
    name: "started_at",
    type: "timestamptz",
    nullable: true,
    default: () => "now()",
  })
  startedAt: Date | null;

  @Column({ name: "finished_at", type: "timestamptz", nullable: true })
  finishedAt: Date | null;
}
