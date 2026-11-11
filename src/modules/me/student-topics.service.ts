import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { ParagraphDto, TopicDetailDto } from "./dto/topic.dto";
import { StudentScheduleService } from "./student-schedule.service";

interface TopicRow {
  id: number;
  title: string;
  position: number | null;
  summary: string | null;
  key_ideas: string[] | null;
  chapter_id: number;
  chapter_title: string | null;
  chapter_number: number | null;
  subject_id: number;
  subject_name: string;
}

/** The student's textbook pages: one topic with its text split into paragraphs. */
@Injectable()
export class StudentTopicsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schedule: StudentScheduleService,
  ) {}

  async topic(topicId: number, user: AuthUser): Promise<TopicDetailDto> {
    if (!(await this.schedule.topicFor(topicId, user.id))) {
      throw new NotFoundException(`Topic ${topicId} not found`);
    }
    const [row]: TopicRow[] = await this.dataSource.query(
      `SELECT topic.id, topic.title, topic.position, topic.summary, topic.key_ideas,
              chapter.id AS chapter_id, chapter.title AS chapter_title, chapter.number AS chapter_number,
              subject.id AS subject_id, subject.name AS subject_name
         FROM topics topic
         JOIN chapters chapter ON chapter.id = topic.chapter_id
         JOIN textbooks textbook ON textbook.id = chapter.textbook_id
         JOIN subjects subject ON subject.id = textbook.subject_id
        WHERE topic.id = $1`,
      [topicId],
    );
    const chunks: {
      id: number;
      page: number | null;
      content: string;
      paragraph_pages: (number | null)[] | null;
    }[] = await this.dataSource.query(
      `SELECT id, page, content, paragraph_pages FROM textbook_chunks
        WHERE topic_id = $1 ORDER BY position NULLS LAST, id`,
      [topicId],
    );
    const [mastery, { prev, next }] = await Promise.all([
      this.schedule.mastery(user.id),
      this.schedule.neighbours(topicId),
    ]);
    // topicFor and the mastery list use the same filter, so the topic is listed.
    const listed = mastery.topics.find((t) => t.topicId === topicId)!;
    return {
      topicId: row.id,
      title: row.title,
      subject: { id: row.subject_id, name: row.subject_name },
      chapter: {
        id: row.chapter_id,
        title: row.chapter_title,
        position: row.chapter_number,
      },
      position: row.position,
      status: listed.status,
      unlocked: listed.unlocked,
      summary: row.summary,
      keyIdeas: row.key_ideas ?? [],
      paragraphs: this.paragraphs(chunks),
      prevTopicId: prev?.topicId ?? null,
      nextTopicId: next?.topicId ?? null,
    };
  }

  /**
   * content:load joins paragraphs with a blank line and records each one's page. A chunk edited
   * by hand may no longer match its page list; its paragraphs then show the chunk's page.
   */
  private paragraphs(
    chunks: {
      id: number;
      page: number | null;
      content: string;
      paragraph_pages: (number | null)[] | null;
    }[],
  ): ParagraphDto[] {
    const result: ParagraphDto[] = [];
    for (const chunk of chunks) {
      const parts = chunk.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      const pages =
        chunk.paragraph_pages?.length === parts.length
          ? chunk.paragraph_pages
          : null;
      parts.forEach((content, i) =>
        result.push({
          id: `${chunk.id}-${i + 1}`,
          chunkId: chunk.id,
          page: pages?.[i] ?? chunk.page,
          position: result.length + 1,
          content,
        }),
      );
    }
    return result;
  }
}
