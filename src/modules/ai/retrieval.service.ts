import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { LlmService } from "./llm.service";

export interface RetrievedChunk {
  id: number;
  topicId: number;
  page: number | null;
  content: string;
  /** Cosine similarity, 1 = identical meaning */
  similarity: number;
}

export type RetrievalScope = { topicId: number } | { subjectId: number };

/** Finds the textbook chunks closest in meaning to a query (pgvector cosine distance). */
@Injectable()
export class RetrievalService {
  constructor(
    private readonly llm: LlmService,
    private readonly dataSource: DataSource,
  ) {}

  async search(
    scope: RetrievalScope,
    query: string,
    k = 5,
  ): Promise<RetrievedChunk[]> {
    if (!query.trim()) throw new BadRequestException("query is empty");
    const [vector] = await this.llm.embed([query], "query");
    const byTopic = "topicId" in scope;
    const rows: (Omit<RetrievedChunk, "similarity"> & {
      similarity: string;
    })[] = await this.dataSource.query(
      `SELECT chunk.id, chunk.topic_id AS "topicId", chunk.page, chunk.content,
              1 - (chunk.embedding <=> $1::vector) AS similarity
         FROM textbook_chunks chunk
         JOIN topics topic ON topic.id = chunk.topic_id
         JOIN chapters chapter ON chapter.id = topic.chapter_id
         JOIN textbooks textbook ON textbook.id = chapter.textbook_id
        WHERE chunk.embedding IS NOT NULL
          AND ${byTopic ? "chunk.topic_id" : "textbook.subject_id"} = $2
        ORDER BY chunk.embedding <=> $1::vector
        LIMIT $3`,
      [
        JSON.stringify(vector),
        byTopic ? scope.topicId : scope.subjectId,
        Math.min(Math.max(k, 1), 50),
      ],
    );
    return rows.map((row) => ({ ...row, similarity: Number(row.similarity) }));
  }

  /** All chunks of a topic in reading order (no AI call). */
  chunksForTopic(
    topicId: number,
  ): Promise<{ id: number; page: number | null; content: string }[]> {
    return this.dataSource.query(
      `SELECT id, page, content FROM textbook_chunks WHERE topic_id = $1 ORDER BY position NULLS LAST, id`,
      [topicId],
    );
  }
}
