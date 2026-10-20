import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { numberTransformer } from "../../../../common/transforms";
import { Topic } from "../../topics/entities/topic.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Check("CHK_topic_mastery_mastery", '"mastery" BETWEEN 0 AND 100')
@Unique("UQ_topic_mastery_student_topic", ["studentId", "topicId"])
@SchoolScope({ via: "student", target: () => User })
@Entity("topic_mastery")
export class TopicMastery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Index("IDX_topic_mastery_topic_id")
  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  /** 0-100 */
  @Column({ name: "mastery", type: "smallint", nullable: true })
  mastery: number | null;

  /** Latest practice result */
  @Column({
    name: "home_score",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  homeScore: number | null;

  /** Latest supervised exam result */
  @Column({
    name: "exam_score",
    type: "numeric",
    precision: 5,
    scale: 2,
    transformer: numberTransformer,
    nullable: true,
  })
  examScore: number | null;

  @Column({
    name: "is_mastered",
    type: "boolean",
    nullable: true,
    default: false,
  })
  isMastered: boolean | null;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
