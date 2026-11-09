/**
 * npm run content:load [-- content/math-7]
 * Loads content/<book>/*.md into textbooks → chapters → topics → textbook_chunks and embeds new or
 * changed chunks. Safe to run again: rows are matched by natural keys (subject code, textbook
 * grade + title, chapter number, topic position, chunk position) and only changes are written.
 * Without AI keys the content is still saved; run again later to add the embeddings.
 */
import { ConfigService } from "@nestjs/config";
import { readdirSync, readFileSync } from "fs";
import { basename, join } from "path";
import { EntityManager } from "typeorm";
import { Counts, upsert } from "./upsert";
import { readAiConfig } from "../modules/ai/ai.config";
import { AiUnavailableException } from "../modules/ai/ai.errors";
import { createLlmService } from "../modules/ai/ai.module";
import {
  parseFrontMatter,
  parseTopic,
  requireMeta,
  TopicContent,
} from "./content/content-parser";
import dataSource from "./data-source";

const counts = {
  topics: { created: 0, updated: 0, unchanged: 0 } as Counts,
  chunks: { created: 0, updated: 0, unchanged: 0 } as Counts,
  chunksRemoved: 0,
};

async function syncChunks(
  manager: EntityManager,
  topicId: number,
  chunks: TopicContent["chunks"],
): Promise<void> {
  const existing: {
    id: number;
    position: number | null;
    page: number | null;
    content: string;
  }[] = await manager.query(
    `SELECT id, position, page, content FROM textbook_chunks WHERE topic_id = $1 ORDER BY position NULLS LAST, id`,
    [topicId],
  );
  const byPosition = new Map(
    existing.filter((c) => c.position !== null).map((c) => [c.position, c]),
  );
  for (const [index, chunk] of chunks.entries()) {
    const position = index + 1;
    const old = byPosition.get(position);
    if (!old) {
      await manager.query(
        `INSERT INTO textbook_chunks (topic_id, position, page, content) VALUES ($1, $2, $3, $4)`,
        [topicId, position, chunk.page, chunk.content],
      );
      counts.chunks.created++;
    } else if (old.content !== chunk.content || old.page !== chunk.page) {
      // Changed text needs a new embedding.
      await manager.query(
        `UPDATE textbook_chunks SET content = $1, page = $2, embedding = NULL WHERE id = $3`,
        [chunk.content, chunk.page, old.id],
      );
      counts.chunks.updated++;
    } else {
      counts.chunks.unchanged++;
    }
  }
  const leftovers = existing.filter(
    (c) => c.position === null || c.position > chunks.length,
  );
  for (const chunk of leftovers) {
    const [{ used }] = await manager.query(
      `SELECT count(*)::int AS used FROM questions WHERE source_chunk_id = $1`,
      [chunk.id],
    );
    if (used) {
      console.warn(
        `  kept chunk ${chunk.id}: no longer in the file but ${used} question(s) cite it`,
      );
    } else {
      await manager.query(`DELETE FROM textbook_chunks WHERE id = $1`, [
        chunk.id,
      ]);
      counts.chunksRemoved++;
    }
  }
}

async function loadBook(dir: string): Promise<number[]> {
  const bookFile = join(dir, "_textbook.md");
  const book = parseFrontMatter(readFileSync(bookFile, "utf8"), bookFile).meta;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
  if (!files.length) throw new Error(`${dir}: no topic files (*.md)`);
  const topics = files.map((f) =>
    parseTopic(readFileSync(join(dir, f), "utf8"), join(dir, f)),
  );

  return dataSource.transaction(async (manager) => {
    const subjectId = await upsert(
      manager,
      "subjects",
      { code: requireMeta(book, "subject_code", bookFile) },
      { name: requireMeta(book, "subject_name", bookFile) },
    );
    const textbookId = await upsert(
      manager,
      "textbooks",
      {
        subject_id: subjectId,
        grade: Number(requireMeta(book, "grade", bookFile)),
        title: requireMeta(book, "title", bookFile),
      },
      {
        language: book.language || null,
        edition_year: book.edition_year ? Number(book.edition_year) : null,
      },
    );
    const topicIds: number[] = [];
    for (const [i, topic] of topics.entries()) {
      const chapterId = await upsert(
        manager,
        "chapters",
        { textbook_id: textbookId, number: topic.chapter },
        { title: topic.chapterTitle },
      );
      const topicId = await upsert(
        manager,
        "topics",
        { chapter_id: chapterId, position: topic.position },
        {
          title: topic.title,
          is_exam_topic: topic.examTopic,
          key_ideas: topic.keyIdeas,
        },
        counts.topics,
      );
      await syncChunks(manager, topicId, topic.chunks);
      topicIds.push(topicId);
      console.log(
        `  ${files[i]} → topic ${topicId} "${topic.title}": ${topic.chunks.length} chunks, ${topic.keyIdeas.length} key ideas`,
      );
    }
    return topicIds;
  });
}

async function embedMissing(topicIds: number[]): Promise<void> {
  const pending: { id: number; content: string }[] = await dataSource.query(
    `SELECT id, content FROM textbook_chunks WHERE embedding IS NULL AND topic_id = ANY($1) ORDER BY id`,
    [topicIds],
  );
  if (!pending.length) {
    console.log("Embeddings: all chunks already embedded");
    return;
  }
  const llm = createLlmService(readAiConfig(new ConfigService()));
  try {
    const vectors = await llm.embed(
      pending.map((c) => c.content),
      "document",
    );
    for (const [i, chunk] of pending.entries()) {
      await dataSource.query(
        `UPDATE textbook_chunks SET embedding = $1::vector WHERE id = $2`,
        [JSON.stringify(vectors[i]), chunk.id],
      );
    }
    console.log(`Embeddings: ${pending.length} chunks embedded`);
  } catch (error) {
    if (!(error instanceof AiUnavailableException)) throw error;
    console.warn(
      `Embeddings skipped (${error.message}). The content is saved; run npm run content:load again once AI is configured.`,
    );
  }
}

async function main() {
  const dir = process.argv[2] ?? join("content", "math-7");
  await dataSource.initialize();
  try {
    console.log(`Loading ${dir} (${basename(dir)})`);
    const topicIds = await loadBook(dir);
    console.log(
      `Topics: ${counts.topics.created} created, ${counts.topics.updated} updated, ${counts.topics.unchanged} unchanged`,
    );
    console.log(
      `Chunks: ${counts.chunks.created} created, ${counts.chunks.updated} updated, ${counts.chunks.unchanged} unchanged, ${counts.chunksRemoved} removed`,
    );
    await embedMissing(topicIds);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`content:load failed: ${error.message}`);
  process.exit(1);
});
