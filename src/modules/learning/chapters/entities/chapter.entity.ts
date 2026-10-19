import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Textbook } from "../../textbooks/entities/textbook.entity";

@SchoolScope("global")
@Entity("chapters")
export class Chapter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "textbook_id", type: "int" })
  textbookId: number;

  @ManyToOne(() => Textbook, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "textbook_id" })
  textbook: Textbook;

  @Column({ name: "number", type: "smallint", nullable: true })
  number: number | null;

  @Column({ name: "title", type: "varchar", nullable: true })
  title: string | null;
}
