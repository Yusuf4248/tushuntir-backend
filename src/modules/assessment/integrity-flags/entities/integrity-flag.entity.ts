import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { FlagStatus } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { numberTransformer } from "../../../../common/transforms";
import { ExamSession } from "../../exam-sessions/entities/exam-session.entity";
import { Topic } from "../../../learning/topics/entities/topic.entity";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ via: "examSession", target: () => ExamSession })
@Entity("integrity_flags")
export class IntegrityFlag {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_integrity_flags_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  @Column({ name: "exam_session_id", type: "int" })
  examSessionId: number;

  @ManyToOne(() => ExamSession, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "exam_session_id" })
  examSession: ExamSession;

  @Column({ name: "reviewed_by", type: "int", nullable: true })
  reviewedBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "reviewed_by" })
  reviewer: User | null;

  @Column({
    name: "home_score",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  homeScore: number | null;

  @Column({
    name: "exam_score",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  examScore: number | null;

  /** Home minus exam score */
  @Column({
    name: "gap",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  gap: number | null;

  @Column({
    name: "status",
    type: "enum",
    enum: FlagStatus,
    enumName: "flag_status",
    nullable: true,
    default: FlagStatus.OPEN,
  })
  status: FlagStatus | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
