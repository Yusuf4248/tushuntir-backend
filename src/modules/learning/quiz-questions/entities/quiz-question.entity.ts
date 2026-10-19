import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Question } from "../../questions/entities/question.entity";
import { Quiz } from "../../quizzes/entities/quiz.entity";

@Unique("UQ_quiz_questions_quiz_question", ["quizId", "questionId"])
@SchoolScope({ via: "quiz", target: () => Quiz })
@Entity("quiz_questions")
export class QuizQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "quiz_id", type: "int" })
  quizId: number;

  @ManyToOne(() => Quiz, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz;

  @Column({ name: "question_id", type: "int" })
  questionId: number;

  @ManyToOne(() => Question, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "question_id" })
  question: Question;

  @Column({ name: "position", type: "smallint", nullable: true })
  position: number | null;

  @Column({ name: "points", type: "smallint", nullable: true, default: 1 })
  points: number | null;
}
