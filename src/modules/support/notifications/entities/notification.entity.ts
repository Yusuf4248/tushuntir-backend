import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
