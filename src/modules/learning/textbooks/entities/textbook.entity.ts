import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Subject } from "../../../school/subjects/entities/subject.entity";

@Check("CHK_textbooks_grade", '"grade" BETWEEN 5 AND 11')
@SchoolScope("global")
@Entity("textbooks")
export class Textbook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "grade", type: "smallint" })
  grade: number;

  @Column({ name: "title", type: "varchar", nullable: true })
  title: string | null;

  @Column({ name: "language", type: "varchar", nullable: true })
  language: string | null;

  @Column({ name: "edition_year", type: "smallint", nullable: true })
  editionYear: number | null;
}
