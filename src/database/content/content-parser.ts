/**
 * Parses the simple Markdown format of content/<book>/*.md:
 *   front matter between --- lines (key: value), then the topic text with optional
 *   "<!-- page: N -->" markers, then a "## Asosiy g'oyalar" list (one "- " line per idea).
 */

export const CHUNK_MIN_CHARS = 800;
export const CHUNK_MAX_CHARS = 1200;

const PAGE_MARKER = /^<!--\s*page:\s*(\d+)\s*-->$/;
const KEY_IDEAS_HEADING = /^##\s+Asosiy g['ʻ‘’]oyalar\s*$/m;

export interface ParsedFile {
  meta: Record<string, string>;
  body: string;
}

export interface TopicContent {
  chapter: number;
  chapterTitle: string;
  position: number;
  title: string;
  examTopic: boolean;
  keyIdeas: string[];
  chunks: { page: number | null; content: string }[];
}

export function parseFrontMatter(text: string, file: string): ParsedFile {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) throw new Error(`${file}: missing front matter (--- block)`);
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon > 0) {
      meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
  }
  return { meta, body: text.slice(match[0].length) };
}

export function requireMeta(
  meta: Record<string, string>,
  key: string,
  file: string,
): string {
  const value = meta[key];
  if (!value) throw new Error(`${file}: front matter is missing "${key}"`);
  return value;
}

export function parseTopic(text: string, file: string): TopicContent {
  const { meta, body } = parseFrontMatter(text, file);
  const integer = (key: string) => {
    const value = Number(requireMeta(meta, key, file));
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${file}: "${key}" must be a positive whole number`);
    }
    return value;
  };
  const [textPart, ideasPart = ""] = body.split(KEY_IDEAS_HEADING);
  return {
    chapter: integer("chapter"),
    chapterTitle: requireMeta(meta, "chapter_title", file),
    position: integer("position"),
    title: requireMeta(meta, "title", file),
    examTopic: meta.exam_topic === "true",
    keyIdeas: ideasPart
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith("- "))
      .map((line) => line.trim().slice(2).trim())
      .filter(Boolean),
    chunks: chunkParagraphs(paragraphsOf(textPart)),
  };
}

/** Paragraphs separated by blank lines, each tagged with the page marker in force where it starts. */
function paragraphsOf(text: string): { page: number | null; text: string }[] {
  const paragraphs: { page: number | null; text: string }[] = [];
  let page: number | null = null;
  let lines: string[] = [];
  let startPage: number | null = null;
  const flush = () => {
    const joined = lines.join("\n").trim();
    if (joined) paragraphs.push({ page: startPage, text: joined });
    lines = [];
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const marker = PAGE_MARKER.exec(line.trim());
    if (marker) {
      flush();
      page = Number(marker[1]);
    } else if (!line.trim()) {
      flush();
    } else {
      if (!lines.length) startPage = page;
      lines.push(line);
    }
  }
  flush();
  return paragraphs;
}

/** Packs whole paragraphs into chunks of about 800–1,200 characters; a chunk keeps the page it starts on. */
function chunkParagraphs(
  paragraphs: { page: number | null; text: string }[],
): { page: number | null; content: string }[] {
  const chunks: { page: number | null; content: string }[] = [];
  let current: { page: number | null; content: string } | null = null;
  for (const paragraph of splitLong(paragraphs)) {
    if (
      current &&
      current.content.length + 2 + paragraph.text.length > CHUNK_MAX_CHARS
    ) {
      chunks.push(current);
      current = null;
    }
    current = current
      ? {
          page: current.page,
          content: `${current.content}\n\n${paragraph.text}`,
        }
      : { page: paragraph.page, content: paragraph.text };
  }
  if (current) chunks.push(current);
  // A short tail reads better merged into the chunk before it.
  const last = chunks[chunks.length - 1];
  const previous = chunks[chunks.length - 2];
  if (
    last &&
    previous &&
    last.content.length < CHUNK_MIN_CHARS / 2 &&
    previous.content.length + last.content.length <= CHUNK_MAX_CHARS * 1.3
  ) {
    previous.content = `${previous.content}\n\n${last.content}`;
    chunks.pop();
  }
  return chunks;
}

/** Paragraphs longer than one chunk are split at sentence ends. */
function splitLong(
  paragraphs: { page: number | null; text: string }[],
): { page: number | null; text: string }[] {
  return paragraphs.flatMap((paragraph) => {
    if (paragraph.text.length <= CHUNK_MAX_CHARS) return [paragraph];
    const pieces: string[] = [];
    let piece = "";
    for (const sentence of paragraph.text.split(/(?<=[.!?])\s+/)) {
      if (piece && piece.length + 1 + sentence.length > CHUNK_MAX_CHARS) {
        pieces.push(piece);
        piece = "";
      }
      piece = piece ? `${piece} ${sentence}` : sentence;
    }
    if (piece) pieces.push(piece);
    return pieces.map((text) => ({ page: paragraph.page, text }));
  });
}
