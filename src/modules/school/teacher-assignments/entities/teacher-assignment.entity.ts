import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { SchoolClass } from "../../classes/entities/school-class.entity";
import { Subject } from "../../subjects/entities/subject.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Unique("UQ_teacher_assignments_teacher_class_subject", [
  "teacherId",
  "classId",
  "subjectId",
])
@SchoolScope({ via: "schoolClass", target: () => SchoolClass })
@Entity("teacher_assignments")
export class TeacherAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "teacher_id", type: "int" })
  teacherId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "teacher_id" })
  teacher: User;

  @Index("IDX_teacher_assignments_class_id")
  @Column({ name: "class_id", type: "int" })
  classId: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;
}
