import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import {
  AttemptHistoryItemDto,
  AttemptKind,
  ParagraphDto,
  StudentSubjectDto,
  TopicDetailDto,
} from "./dto/topic.dto";
import { MASTERY_PASS_PERCENT, MasteryStatus } from "./me.types";
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

  /** Subjects taught to the student's class, with topic progress (0/0 without a textbook). */
  async subjects(user: AuthUser): Promise<StudentSubjectDto[]> {
    const studentClass = await this.schedule.classOf(user.id);
    if (!studentClass) return [];
    const [subjects, mastery]: [
      { id: number; name: string }[],
      Awaited<ReturnType<StudentScheduleService["mastery"]>>,
    ] = await Promise.all([
      this.dataSource.query(
        `SELECT DISTINCT subject.id, subject.name
           FROM teacher_assignments assignment JOIN subjects subject ON subject.id = assignment.subject_id
          WHERE assignment.class_id = $1
          ORDER BY subject.name, subject.id`,
        [studentClass.id],
      ),
      this.schedule.mastery(user.id),
    ]);
    return subjects.map((subject) => {
      const topics = mastery.topics.filter((t) => t.subjectId === subject.id);
      return {
        id: subject.id,
        name: subject.name,
        topicsTotal: topics.length,
        topicsMastered: topics.filter(
          (t) => t.status === MasteryStatus.MASTERED,
        ).length,
      };
    });
  }

  /** Lesson quizzes, practice quizzes and checkpoint tries, newest first. Exams are not listed. */
  async attempts(
    user: AuthUser,
    query: { limit?: number; topicId?: number },
  ): Promise<AttemptHistoryItemDto[]> {
    const rows: {
      id: number;
      kind: AttemptKind;
      quiz_id: number | null;
      topic_id: number | null;
      topic_title: string | null;
      subject_id: number | null;
      subject_name: string | null;
      started_at: Date | null;
      finished_at: Date | null;
      score_percent: string | null;
      result: "passed" | "not_yet" | null;
      open_mistakes: number | null;
    }[] = await this.dataSource.query(
      `WITH history AS (
         SELECT attempt.id,
                CASE quiz.kind WHEN 'practice' THEN 'practice' ELSE 'lesson_quiz' END AS kind,
                quiz.id AS quiz_id, quiz.topic_id, attempt.started_at, attempt.finished_at,
                attempt.score_percent,
                CASE WHEN attempt.finished_at IS NULL THEN NULL
                     WHEN attempt.score_percent >= $3 THEN 'passed' ELSE 'not_yet' END AS result,
                CASE WHEN attempt.finished_at IS NULL THEN NULL
                     ELSE (SELECT count(*)::int FROM attempt_answers answer
                            WHERE answer.attempt_id = attempt.id
                              AND answer.is_correct IS NOT TRUE AND answer.fixed_at IS NULL) END AS open_mistakes
           FROM attempts attempt JOIN quizzes quiz ON quiz.id = attempt.quiz_id
          WHERE attempt.student_id = $1 AND quiz.kind IN ('homework', 'practice')
         UNION ALL
         SELECT checkpoint.id, 'checkpoint', NULL, checkpoint.topic_id, checkpoint.created_at, checkpoint.judged_at,
                CASE WHEN checkpoint.result IS NULL THEN NULL
                     ELSE round(100.0 * jsonb_array_length(checkpoint.matched_ideas)
                                / NULLIF(jsonb_array_length(checkpoint.matched_ideas)
                                         + jsonb_array_length(checkpoint.missing_ideas), 0), 2) END,
                checkpoint.result,
                CASE WHEN checkpoint.result IS NULL THEN NULL ELSE 0 END
           FROM checkpoint_attempts checkpoint
          WHERE checkpoint.student_id = $1)
       SELECT history.*, topic.title AS topic_title, subject.id AS subject_id, subject.name AS subject_name
         FROM history
         LEFT JOIN topics topic ON topic.id = history.topic_id
         LEFT JOIN chapters chapter ON chapter.id = topic.chapter_id
         LEFT JOIN textbooks textbook ON textbook.id = chapter.textbook_id
         LEFT JOIN subjects subject ON subject.id = textbook.subject_id
        WHERE $4::int IS NULL OR history.topic_id = $4
        ORDER BY history.started_at DESC NULLS LAST, history.id DESC
        LIMIT $2`,
      [user.id, query.limit ?? 20, MASTERY_PASS_PERCENT, query.topicId ?? null],
    );
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      quizId: row.quiz_id,
      topic:
        row.topic_id !== null
          ? { id: row.topic_id, title: row.topic_title! }
          : null,
      subject:
        row.subject_id !== null
          ? { id: row.subject_id, name: row.subject_name! }
          : null,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      scorePercent:
        row.score_percent === null ? null : Number(row.score_percent),
      result: row.result,
      openMistakes: row.open_mistakes,
    }));
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
