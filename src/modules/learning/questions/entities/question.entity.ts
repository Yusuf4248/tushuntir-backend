import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { QuestionStatus, QuestionType } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { TextbookChunk } from "../../textbook-chunks/entities/textbook-chunk.entity";
import { Topic } from "../../topics/entities/topic.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Check("CHK_questions_difficulty", '"difficulty" BETWEEN 1 AND 3')
@SchoolScope("global")
@Entity("questions")
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  @Column({ name: "source_chunk_id", type: "int", nullable: true })
  sourceChunkId: number | null;

  @ManyToOne(() => TextbookChunk, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "source_chunk_id" })
  sourceChunk: TextbookChunk | null;

  @Column({ name: "approved_by", type: "int", nullable: true })
  approvedBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "approved_by" })
  approver: User | null;

  @Column({
    name: "type",
    type: "enum",
    enum: QuestionType,
    enumName: "question_type",
  })
  type: QuestionType;

  @Column({ name: "prompt", type: "text" })
  prompt: string;

  /** Multiple choice only: the answer options */
  @Column({ name: "options", type: "jsonb", nullable: true })
  options: string[] | null;

  @Column({ name: "correct_answer", type: "text" })
  correctAnswer: string;

  @Column({ name: "hint", type: "text", nullable: true })
  hint: string | null;

  @Column({ name: "difficulty", type: "smallint", nullable: true })
  difficulty: number | null;

  @Column({
    name: "generated_by_ai",
    type: "boolean",
    nullable: true,
    default: true,
  })
  generatedByAi: boolean | null;

  /** Teacher must approve before students see it */
  @Column({
    name: "status",
    type: "enum",
    enum: QuestionStatus,
    enumName: "question_status",
    nullable: true,
    default: QuestionStatus.DRAFT,
  })
  status: QuestionStatus | null;

  @Column({ name: "approved_at", type: "timestamptz", nullable: true })
  approvedAt: Date | null;
}
