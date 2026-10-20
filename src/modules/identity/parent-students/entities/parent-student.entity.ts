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
import { User } from "../../users/entities/user.entity";

@Unique("UQ_parent_students_parent_student", ["parentId", "studentId"])
@SchoolScope({ via: "student", target: () => User })
@Entity("parent_students")
export class ParentStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "parent_id", type: "int" })
  parentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "parent_id" })
  parent: User;

  @Index("IDX_parent_students_student_id")
  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "relation", type: "varchar", nullable: true })
  relation: string | null;
}
