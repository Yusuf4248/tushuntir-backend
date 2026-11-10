import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { User } from "../../../identity/users/entities/user.entity";
import { Topic } from "../../topics/entities/topic.entity";

/**
 * One try of the "Tushuntir" checkpoint: the AI classmate Sardor states a misconception, the
 * student explains the topic (voice or text), and the answer is judged against topics.key_ideas.
 * A row with result NULL is the open try; a not_yet result opens the next try right away.
 */
@Check("CHK_checkpoint_attempts_mode", `"mode" IN ('voice', 'text')`)
@Check("CHK_checkpoint_attempts_result", `"result" IN ('passed', 'not_yet')`)
@Index("IDX_checkpoint_attempts_student_topic", ["studentId", "topicId"])
@SchoolScope({ via: "student", target: () => User })
@Entity("checkpoint_attempts")
export class CheckpointAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Index("IDX_checkpoint_attempts_topic_id")
  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  /** 1, 2, 3, … per student and topic */
  @Column({ name: "try_number", type: "smallint" })
  tryNumber: number;

  /** voice | text; set when the student answers */
  @Column({ name: "mode", type: "varchar", length: 10, nullable: true })
  mode: string | null;

  /** What Sardor says to open the try */
  @Column({ name: "prompt", type: "text" })
  prompt: string;

  /** The student's explanation (typed, or the speech-to-text transcript) */
  @Column({ name: "transcript", type: "text", nullable: true })
  transcript: string | null;

  /** Sardor's one follow-up question when key ideas were missing */
  @Column({ name: "follow_up", type: "text", nullable: true })
  followUp: string | null;

  @Column({ name: "follow_up_transcript", type: "text", nullable: true })
  followUpTranscript: string | null;

  /** passed | not_yet; NULL while the try is open */
  @Column({ name: "result", type: "varchar", length: 10, nullable: true })
  result: string | null;

  @Column({ name: "matched_ideas", type: "jsonb", nullable: true })
  matchedIdeas: string[] | null;

  @Column({ name: "missing_ideas", type: "jsonb", nullable: true })
  missingIdeas: string[] | null;

  /** Mathematically wrong claims found in the explanation */
  @Column({ name: "wrong_statements", type: "jsonb", nullable: true })
  wrongStatements: string[] | null;

  /** Shown with the result: praise when passed, a short new explanation when not yet */
  @Column({ name: "feedback", type: "text", nullable: true })
  feedback: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @Column({ name: "judged_at", type: "timestamptz", nullable: true })
  judgedAt: Date | null;
}
