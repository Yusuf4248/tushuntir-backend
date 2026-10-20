import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Room } from "../../rooms/entities/room.entity";
import { TeacherAssignment } from "../../teacher-assignments/entities/teacher-assignment.entity";
import { Term } from "../../terms/entities/term.entity";

@Check("CHK_timetable_slots_weekday", '"weekday" BETWEEN 1 AND 6')
@SchoolScope({ via: "teacherAssignment", target: () => TeacherAssignment })
@Entity("timetable_slots")
export class TimetableSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_timetable_slots_teacher_assignment_id")
  @Column({ name: "teacher_assignment_id", type: "int" })
  teacherAssignmentId: number;

  @ManyToOne(() => TeacherAssignment, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacher_assignment_id" })
  teacherAssignment: TeacherAssignment;

  @Column({ name: "room_id", type: "int", nullable: true })
  roomId: number | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "room_id" })
  room: Room | null;

  @Column({ name: "term_id", type: "int", nullable: true })
  termId: number | null;

  @ManyToOne(() => Term, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "term_id" })
  term: Term | null;

  /** 1 = Monday ... 6 = Saturday */
  @Column({ name: "weekday", type: "smallint", nullable: true })
  weekday: number | null;

  /** Lesson number in the day */
  @Column({ name: "period", type: "smallint", nullable: true })
  period: number | null;

  @Column({ name: "starts_at", type: "time", nullable: true })
  startsAt: string | null;

  @Column({ name: "ends_at", type: "time", nullable: true })
  endsAt: string | null;
}
