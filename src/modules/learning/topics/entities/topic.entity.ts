import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Chapter } from "../../chapters/entities/chapter.entity";

@SchoolScope("global")
@Entity("topics")
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "chapter_id", type: "int" })
  chapterId: number;

  @ManyToOne(() => Chapter, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "chapter_id" })
  chapter: Chapter;

  @Column({ name: "position", type: "smallint", nullable: true })
  position: number | null;

  @Column({ name: "title", type: "varchar" })
  title: string;

  /** Appears in the university entrance exam */
  @Column({
    name: "is_exam_topic",
    type: "boolean",
    nullable: true,
    default: false,
  })
  isExamTopic: boolean | null;
}
