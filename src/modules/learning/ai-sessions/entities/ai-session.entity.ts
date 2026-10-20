import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Subject } from "../../../school/subjects/entities/subject.entity";
import { Topic } from "../../topics/entities/topic.entity";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ via: "student", target: () => User })
@Entity("ai_sessions")
export class AiSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_ai_sessions_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "topic_id", type: "int", nullable: true })
  topicId: number | null;

  @ManyToOne(() => Topic, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic | null;

  @Column({ name: "kind", type: "varchar", nullable: true })
  kind: string | null;

  @Column({
    name: "started_at",
    type: "timestamptz",
    nullable: true,
    default: () => "now()",
  })
  startedAt: Date | null;

  @Column({ name: "ended_at", type: "timestamptz", nullable: true })
  endedAt: Date | null;
}
