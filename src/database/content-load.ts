/**
 * npm run content:load [-- content/math-7]
 * Loads content/<book>/*.md into textbooks → chapters → topics → textbook_chunks, embeds new or
 * changed chunks, and has the AI write a short summary for topics without one. Safe to run again: rows are matched by natural keys (subject code, textbook
 * grade + title, chapter number, topic position, chunk position) and only changes are written.
 * Without AI keys the content is still saved; run again later to add the embeddings.
 */
import { ConfigService } from "@nestjs/config";
import { readdirSync, readFileSync } from "fs";
import { basename, join } from "path";
import { EntityManager } from "typeorm";
import * as z from "zod";
import { Counts, upsert } from "./upsert";
import { readAiConfig } from "../modules/ai/ai.config";
import { AiUnavailableException } from "../modules/ai/ai.errors";
import { createLlmService } from "../modules/ai/ai.module";
import {
  TOPIC_SUMMARY_SYSTEM,
  topicSummaryMessage,
} from "../modules/ai/prompts/topic-summary.prompt";
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

const Summaries = z.object({
  summaries: z.array(z.object({ index: z.number(), summary: z.string() })),
});

const samePages = (a: unknown, b: (number | null)[]) =>
  JSON.stringify(a ?? null) === JSON.stringify(b);

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
    paragraph_pages: (number | null)[] | null;
  }[] = await manager.query(
    `SELECT id, position, page, content, paragraph_pages FROM textbook_chunks WHERE topic_id = $1 ORDER BY position NULLS LAST, id`,
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
        `INSERT INTO textbook_chunks (topic_id, position, page, content, paragraph_pages) VALUES ($1, $2, $3, $4, $5)`,
        [
          topicId,
          position,
          chunk.page,
          chunk.content,
          JSON.stringify(chunk.paragraphPages),
        ],
      );
      counts.chunks.created++;
    } else if (old.content !== chunk.content || old.page !== chunk.page) {
      // Changed text needs a new embedding.
      await manager.query(
        `UPDATE textbook_chunks SET content = $1, page = $2, paragraph_pages = $3, embedding = NULL WHERE id = $4`,
        [
          chunk.content,
          chunk.page,
          JSON.stringify(chunk.paragraphPages),
          old.id,
        ],
      );
      counts.chunks.updated++;
    } else if (!samePages(old.paragraph_pages, chunk.paragraphPages)) {
      // Only the page list is new (e.g. filled for the first time): the embedding stays valid.
      await manager.query(
        `UPDATE textbook_chunks SET paragraph_pages = $1 WHERE id = $2`,
        [JSON.stringify(chunk.paragraphPages), old.id],
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
          // A summary in the file wins; otherwise an existing one (AI or teacher) is kept.
          ...(topic.summary ? { summary: topic.summary } : {}),
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

/** One AI call writes the summaries still missing; existing ones are never regenerated. */
async function summarizeMissing(topicIds: number[]): Promise<void> {
  const missing: { id: number; title: string; text: string }[] =
    await dataSource.query(
      `SELECT topic.id, topic.title,
              string_agg(chunk.content, E'\n\n' ORDER BY chunk.position NULLS LAST, chunk.id) AS text
         FROM topics topic JOIN textbook_chunks chunk ON chunk.topic_id = topic.id
        WHERE topic.id = ANY($1) AND topic.summary IS NULL
        GROUP BY topic.id, topic.title ORDER BY topic.id`,
      [topicIds],
    );
  if (!missing.length) {
    console.log("Summaries: every topic already has one");
    return;
  }
  const llm = createLlmService(readAiConfig(new ConfigService()));
  try {
    const { summaries } = await llm.chatJson({
      purpose: "topic-summary",
      system: TOPIC_SUMMARY_SYSTEM,
      messages: [
        {
          role: "user",
          content: topicSummaryMessage(
            missing.map((t, index) => ({
              index,
              title: t.title,
              text: t.text,
            })),
          ),
        },
      ],
      schema: Summaries,
      effort: "low",
      maxTokens: 4_000,
    });
    let written = 0;
    for (const { index, summary } of summaries) {
      const topic = missing[index];
      if (!topic || !summary.trim()) continue;
      await dataSource.query(
        `UPDATE topics SET summary = $1 WHERE id = $2 AND summary IS NULL`,
        [summary.trim(), topic.id],
      );
      written++;
    }
    console.log(`Summaries: ${written} of ${missing.length} written by the AI`);
  } catch (error) {
    if (!(error instanceof AiUnavailableException)) throw error;
    console.warn(
      `Summaries skipped (${error.message}). Run npm run content:load again once AI is configured.`,
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
    await summarizeMissing(topicIds);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`content:load failed: ${error.message}`);
  process.exit(1);
});
