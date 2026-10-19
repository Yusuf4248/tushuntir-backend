import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { Topic } from "../../topics/entities/topic.entity";

@SchoolScope("global")
@Entity("textbook_chunks")
export class TextbookChunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  @Column({ name: "page", type: "smallint", nullable: true })
  page: number | null;

  @Column({ name: "content", type: "text" })
  content: string;
}
