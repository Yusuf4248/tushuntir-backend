import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Quiz } from "../../../learning/quizzes/entities/quiz.entity";
import { Room } from "../../../school/rooms/entities/room.entity";
import { School } from "../../../school/schools/entities/school.entity";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ column: "schoolId" })
@Entity("exam_sessions")
export class ExamSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_exam_sessions_school_id")
  @Column({ name: "school_id", type: "int" })
  schoolId: number;

  @ManyToOne(() => School, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "school_id" })
  school: School;

  @Index("IDX_exam_sessions_quiz_id")
  @Column({ name: "quiz_id", type: "int" })
  quizId: number;

  @ManyToOne(() => Quiz, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz;

  @Column({ name: "room_id", type: "int", nullable: true })
  roomId: number | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "room_id" })
  room: Room | null;

  @Column({ name: "supervisor_id", type: "int", nullable: true })
  supervisorId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "supervisor_id" })
  supervisor: User | null;

  @Column({ name: "starts_at", type: "timestamptz", nullable: true })
  startsAt: Date | null;

  @Column({ name: "ends_at", type: "timestamptz", nullable: true })
  endsAt: Date | null;

  /** Entered on the lab computer to unlock exam mode */
  @Column({ name: "access_code", type: "varchar", length: 32, nullable: true })
  accessCode: string | null;
}
