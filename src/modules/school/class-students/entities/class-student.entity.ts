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
import { User } from "../../../identity/users/entities/user.entity";

@Unique("UQ_class_students_class_student", ["classId", "studentId"])
@SchoolScope({ via: "schoolClass", target: () => SchoolClass })
@Entity("class_students")
export class ClassStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "class_id", type: "int" })
  classId: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "class_id" })
  schoolClass: SchoolClass;

  @Index("IDX_class_students_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "joined_on", type: "date", nullable: true })
  joinedOn: string | null;
}
