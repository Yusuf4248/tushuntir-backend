import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { AiSession } from "../../ai-sessions/entities/ai-session.entity";

@SchoolScope({ via: "session", target: () => AiSession })
@Entity("ai_messages")
export class AiMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "session_id", type: "int" })
  sessionId: number;

  @ManyToOne(() => AiSession, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "session_id" })
  session: AiSession;

  @Column({ name: "role", type: "varchar", nullable: true })
  role: string | null;

  @Column({ name: "content", type: "text" })
  content: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
