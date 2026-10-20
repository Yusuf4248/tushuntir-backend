import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { AttendanceStatus } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Lesson } from "../../lessons/entities/lesson.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Unique("UQ_attendance_lesson_student", ["lessonId", "studentId"])
@SchoolScope({ via: "lesson", target: () => Lesson })
@Entity("attendance")
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "lesson_id", type: "int" })
  lessonId: number;

  @ManyToOne(() => Lesson, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "lesson_id" })
  lesson: Lesson;

  @Index("IDX_attendance_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({
    name: "status",
    type: "enum",
    enum: AttendanceStatus,
    enumName: "attendance_status",
  })
  status: AttendanceStatus;

  @Column({ name: "note", type: "varchar", nullable: true })
  note: string | null;
}
