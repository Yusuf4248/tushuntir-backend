import { ApiHideProperty } from "@nestjs/swagger";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SchoolScope } from "../../../../common/scope/school-scope";
import { EMBEDDING_DIMENSION } from "../../../ai/ai.config";
import { Topic } from "../../topics/entities/topic.entity";

@SchoolScope("global")
@Entity("textbook_chunks")
export class TextbookChunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_textbook_chunks_topic_id")
  @Column({ name: "topic_id", type: "int" })
  topicId: number;

  @ManyToOne(() => Topic, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "topic_id" })
  topic: Topic;

  @Column({ name: "page", type: "smallint", nullable: true })
  page: number | null;

  /** Order of the chunk inside its topic (set by content:load) */
  @Column({ name: "position", type: "smallint", nullable: true })
  position: number | null;

  @Column({ name: "content", type: "text" })
  content: string;

  /** pgvector embedding for retrieval; written by content:load, never returned by the API */
  @ApiHideProperty()
  @Index("IDX_textbook_chunks_embedding_hnsw", { synchronize: false })
  @Column({
    name: "embedding",
    type: "vector",
    length: EMBEDDING_DIMENSION,
    nullable: true,
    select: false,
  })
  embedding?: string | null;
}
