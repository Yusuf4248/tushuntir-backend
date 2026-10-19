import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { QuizKind } from "../../../../common/enums";
import { columnSql, SchoolScope } from "../../../../common/scope/school-scope";
import { SchoolClass } from "../../../school/classes/entities/school-class.entity";
import { Topic } from "../../topics/entities/topic.entity";
import { User } from "../../../identity/users/entities/user.entity";

/**
 * A quiz belongs to its class's school; a quiz without a class (e.g. topic practice)
 * belongs to the school of the user who created it.
 */
@SchoolScope({
  expression: (qb, alias, nextAlias) => {
    const schoolClass = nextAlias();
    const creator = nextAlias();
    qb.leftJoin(`${alias}.schoolClass`, schoolClass).leftJoin(
      `${alias}.creator`,
      creator,
    );
    return `COALESCE(${columnSql(qb, SchoolClass, schoolClass, "schoolId")}, ${columnSql(qb, User, creator, "schoolId")})`;
  },
})
@Entity("quizzes")
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "topic_id", type: "int", nullable: true })
  topicId: number | null;

  @ManyToOne(() => Topic, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic | null;

  @Column({ name: "class_id", type: "int", nullable: true })
  classId: number | null;

  @ManyToOne(() => SchoolClass, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass | null;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by" })
  creator: User | null;

  @Column({ name: "kind", type: "enum", enum: QuizKind, enumName: "quiz_kind" })
  kind: QuizKind;

  @Column({ name: "title", type: "varchar", nullable: true })
  title: string | null;

  @Column({ name: "time_limit_min", type: "smallint", nullable: true })
  timeLimitMin: number | null;

  /** Each student gets a different order */
  @Column({
    name: "shuffle_questions",
    type: "boolean",
    nullable: true,
    default: true,
  })
  shuffleQuestions: boolean | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
