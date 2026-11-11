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

  /** Main ideas a student must be able to explain (used by the voice checkpoint) */
  @Column({ name: "key_ideas", type: "jsonb", nullable: true })
  keyIdeas: string[] | null;

  /** Short summary for the student's topic page (from the content file, else AI-written once by content:load) */
  @Column({ name: "summary", type: "text", nullable: true })
  summary: string | null;
}
