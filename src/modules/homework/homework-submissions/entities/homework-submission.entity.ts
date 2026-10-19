import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { SubmissionStatus } from "../../../../common/enums";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Homework } from "../../homework/entities/homework.entity";
import { User } from "../../../identity/users/entities/user.entity";

@Unique("UQ_homework_submissions_homework_student", ["homeworkId", "studentId"])
@SchoolScope({ via: "homework", target: () => Homework })
@Entity("homework_submissions")
export class HomeworkSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "homework_id", type: "int" })
  homeworkId: number;

  @ManyToOne(() => Homework, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "homework_id" })
  homework: Homework;

  @Column({ name: "student_id", type: "int" })
  studentId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "student_id" })
  student: User;

  @Column({ name: "checked_by", type: "int", nullable: true })
  checkedBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "checked_by" })
  checker: User | null;

  @Column({ name: "answer_text", type: "text", nullable: true })
  answerText: string | null;

  @Column({
    name: "status",
    type: "enum",
    enum: SubmissionStatus,
    enumName: "submission_status",
    nullable: true,
    default: SubmissionStatus.SUBMITTED,
  })
  status: SubmissionStatus | null;

  @Column({ name: "score", type: "smallint", nullable: true })
  score: number | null;

  @Column({ name: "feedback", type: "text", nullable: true })
  feedback: string | null;

  @Column({
    name: "submitted_at",
    type: "timestamptz",
    nullable: true,
    default: () => "now()",
  })
  submittedAt: Date | null;

  @Column({ name: "checked_at", type: "timestamptz", nullable: true })
  checkedAt: Date | null;
}
