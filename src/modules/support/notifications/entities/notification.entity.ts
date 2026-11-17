import {
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

@SchoolScope({ via: "user", target: () => User })
@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_notifications_user_id")
  @Column({ name: "user_id", type: "int" })
  userId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "type", type: "varchar", nullable: true })
  type: string | null;

  @Column({ name: "title", type: "varchar", nullable: true })
  title: string | null;

  @Column({ name: "body", type: "text", nullable: true })
  body: string | null;

  /**
   * What the notification is about, for links and to avoid duplicates, e.g. { "homeworkId": 12 },
   * { "quizId": 15 }, { "gradeId": 40 }, { "topicId": 8 }.
   */
  @Column({ name: "data", type: "jsonb", nullable: true })
  data: Record<string, unknown> | null;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
