import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Lesson } from "../../lessons/entities/lesson.entity";
import { TeacherAssignment } from "../../../school/teacher-assignments/entities/teacher-assignment.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Check("CHK_grades_value", '"value" BETWEEN 2 AND 5')
@SchoolScope({ via: "teacherAssignment", target: () => TeacherAssignment })
@Entity("grades")
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_grades_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Index("IDX_grades_teacher_assignment_id")
  @Column({ name: "teacher_assignment_id", type: "int" })
  teacherAssignmentId: number;

  @ManyToOne(() => TeacherAssignment, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacher_assignment_id" })
  teacherAssignment: TeacherAssignment;

  @Index("IDX_grades_lesson_id")
  @Column({ name: "lesson_id", type: "int", nullable: true })
  lessonId: number | null;

  @ManyToOne(() => Lesson, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "lesson_id" })
  lesson: Lesson | null;

  @Column({ name: "kind", type: "varchar", nullable: true })
  kind: string | null;

  /** 2-5 scale */
  @Column({ name: "value", type: "smallint", nullable: true })
  value: number | null;

  @Column({ name: "comment", type: "varchar", nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
