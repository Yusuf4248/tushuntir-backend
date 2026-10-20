import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Room } from "../../../school/rooms/entities/room.entity";
import { School } from "../../../school/schools/entities/school.entity";
import { Topic } from "../../../learning/topics/entities/topic.entity";
import { User } from "../../../identity/users/entities/user.entity";

@SchoolScope({ column: "schoolId" })
@Entity("support_groups")
export class SupportGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_support_groups_school_id")
  @Column({ name: "school_id", type: "int" })
  schoolId: number;

  @ManyToOne(() => School, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "school_id" })
  school: School;

  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  @Column({ name: "teacher_id", type: "int" })
  teacherId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacher_id" })
  teacher: User;

  @Column({ name: "room_id", type: "int", nullable: true })
  roomId: number | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "room_id" })
  room: Room | null;

  @Column({ name: "scheduled_at", type: "timestamptz", nullable: true })
  scheduledAt: Date | null;

  @Column({ name: "status", type: "varchar", nullable: true })
  status: string | null;
}
