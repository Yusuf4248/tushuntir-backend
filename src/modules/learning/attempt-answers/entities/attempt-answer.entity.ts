import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { numberTransformer } from "../../../../common/transforms";
import { Attempt } from "../../attempts/entities/attempt.entity";
import { Question } from "../../questions/entities/question.entity";

@SchoolScope({ via: "attempt", target: () => Attempt })
@Entity("attempt_answers")
export class AttemptAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "attempt_id", type: "int" })
  attemptId: number;

  @ManyToOne(() => Attempt, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "attempt_id" })
  attempt: Attempt;

  @Column({ name: "question_id", type: "int" })
  questionId: number;

  @ManyToOne(() => Question, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "question_id" })
  question: Question;

  @Column({ name: "answer", type: "text", nullable: true })
  answer: string | null;

  @Column({ name: "is_correct", type: "boolean", nullable: true })
  isCorrect: boolean | null;

  @Column({ name: "hints_used", type: "smallint", nullable: true, default: 0 })
  hintsUsed: number | null;

  @Column({
    name: "points_earned",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  pointsEarned: number | null;

  /** AI check for short answers */
  @Column({ name: "ai_feedback", type: "text", nullable: true })
  aiFeedback: string | null;
}
