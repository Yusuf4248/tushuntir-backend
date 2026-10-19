import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { SupportGroup } from "../../support-groups/entities/support-group.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Unique("UQ_support_group_students_group_student", [
  "supportGroupId",
  "studentId",
])
@SchoolScope({ via: "supportGroup", target: () => SupportGroup })
@Entity("support_group_students")
export class SupportGroupStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "support_group_id", type: "int" })
  supportGroupId: number;

  @ManyToOne(() => SupportGroup, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "support_group_id" })
  supportGroup: SupportGroup;

  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "attended", type: "boolean", nullable: true })
  attended: boolean | null;
}
