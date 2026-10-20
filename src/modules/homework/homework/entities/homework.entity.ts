import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Lesson } from "../../../daily/lessons/entities/lesson.entity";
import { Quiz } from "../../../learning/quizzes/entities/quiz.entity";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ via: "lesson", target: () => Lesson })
@Entity("homework")
export class Homework {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_homework_lesson_id")
  @Column({ name: "lesson_id", type: "int" })
  lessonId: number;

  @ManyToOne(() => Lesson, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "lesson_id" })
  lesson: Lesson;

  @Column({ name: "quiz_id", type: "int", nullable: true })
  quizId: number | null;

  @ManyToOne(() => Quiz, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz | null;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by" })
  creator: User | null;

  @Column({ name: "title", type: "varchar" })
  title: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @Column({ name: "due_at", type: "timestamptz", nullable: true })
  dueAt: Date | null;
}
