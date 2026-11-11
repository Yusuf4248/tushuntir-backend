/** A textbook chunk as stored: paragraphs joined by a blank line, one page per paragraph. */
export interface StoredChunk {
  id: number;
  page: number | null;
  content: string;
  paragraph_pages: (number | null)[] | null;
}

export interface ChunkParagraph {
  /** "<chunkId>-<paragraph number in the chunk>", the same ids as GET /me/topics/:id */
  id: string;
  chunkId: number;
  page: number | null;
  content: string;
}

/**
 * Splits a chunk into its paragraphs. A chunk edited by hand may no longer match its page list;
 * its paragraphs then show the chunk's page.
 */
export function chunkParagraphs(chunk: StoredChunk): ChunkParagraph[] {
  const parts = chunk.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const pages =
    chunk.paragraph_pages?.length === parts.length
      ? chunk.paragraph_pages
      : null;
  return parts.map((content, i) => ({
    id: `${chunk.id}-${i + 1}`,
    chunkId: chunk.id,
    page: pages?.[i] ?? chunk.page,
    content,
  }));
}

/** Words and maths tokens (3a^2, -5x, 10) in one apostrophe style, lower case. */
function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[‘’ʻʼ`]/g, "'")
      .replace(/[−–—]/g, "-")
      .match(/[a-z0-9'^]+/g)
      ?.filter((t) => t.length >= 2) ?? [],
  );
}

/**
 * The paragraph a question was written from: the one sharing the most of the question's words
 * and expressions, where words found in every paragraph of the chunk count for little.
 * Null when nothing is shared.
 */
export function bestParagraph(
  paragraphs: ChunkParagraph[],
  questionText: string,
): ChunkParagraph | null {
  if (paragraphs.length <= 1) return paragraphs[0] ?? null;
  const asked = tokens(questionText);
  const sets = paragraphs.map((p) => tokens(p.content));
  const spread = (t: string) => sets.filter((s) => s.has(t)).length;
  let best: ChunkParagraph | null = null;
  let bestScore = 0;
  paragraphs.forEach((paragraph, i) => {
    let score = 0;
    for (const t of asked) {
      if (sets[i].has(t)) score += t.length / spread(t);
    }
    if (score > bestScore) {
      best = paragraph;
      bestScore = score;
    }
  });
  return best;
}
