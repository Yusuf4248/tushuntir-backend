import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { TeacherAssignment } from "../../../school/teacher-assignments/entities/teacher-assignment.entity";
import { TimetableSlot } from "../../../school/timetable-slots/entities/timetable-slot.entity";
import { Topic } from "../../../learning/topics/entities/topic.entity";

@SchoolScope({ via: "teacherAssignment", target: () => TeacherAssignment })
@Entity("lessons")
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "teacher_assignment_id", type: "int" })
  teacherAssignmentId: number;

  @ManyToOne(() => TeacherAssignment, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacher_assignment_id" })
  teacherAssignment: TeacherAssignment;

  @Column({ name: "timetable_slot_id", type: "int", nullable: true })
  timetableSlotId: number | null;

  @ManyToOne(() => TimetableSlot, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "timetable_slot_id" })
  timetableSlot: TimetableSlot | null;

  @Column({ name: "topic_id", type: "int", nullable: true })
  topicId: number | null;

  @ManyToOne(() => Topic, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic | null;

  @Column({ name: "date", type: "date" })
  date: string;

  @Column({ name: "notes", type: "text", nullable: true })
  notes: string | null;
}
