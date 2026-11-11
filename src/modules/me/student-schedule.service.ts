import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { appTimezone, localDate } from "../../common/school-time";
import {
  MasteryListDto,
  QuizListDto,
  StudentQuizDto,
  TodayDto,
  TodayLessonDto,
} from "./dto/me-responses.dto";
import {
  LessonStatus,
  MASTERY_RULE,
  MasteryStatus,
  masteryStatus,
  StudentQuizStatus,
} from "./me.types";

export interface StudentClass {
  id: number;
  grade: number;
  letter: string;
}

/** A topic of one of the student's class subjects, at the class grade. */
export interface StudentTopic {
  id: number;
  title: string;
  subject_id: number;
  key_ideas: string[] | null;
  class_id: number;
}

/** Checkpoint tries of one student in one topic. */
export interface CheckpointStats {
  tries: number;
  lastResult: string | null;
  lastTriedAt: Date | null;
  notYetSinceLastPass: number;
  openCheckpointId: number | null;
}

interface QuizRow {
  quizId: number;
  title: string | null;
  topicId: number | null;
  topicTitle: string | null;
  subjectId: number;
  subjectName: string;
  lessonId: number;
  lessonDate: string;
  unlocksAt: Date;
  dueAt: Date | null;
  attemptId: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  scorePercent: string | null;
}

/** Read side of the student app: today's timetable, lesson quizzes and topic mastery. */
@Injectable()
export class StudentScheduleService {
  constructor(private readonly dataSource: DataSource) {}

  /** The student's class in the current academic year (latest enrolment otherwise). */
  async classOf(studentId: number): Promise<StudentClass | null> {
    const [row] = await this.dataSource.query(
      `SELECT class.id, class.grade, class.letter
         FROM class_students enrolment
         JOIN classes class ON class.id = enrolment.class_id
         JOIN academic_years year ON year.id = class.academic_year_id
        WHERE enrolment.student_id = $1
        ORDER BY year.is_current DESC NULLS LAST, year.starts_on DESC NULLS LAST, class.id DESC
        LIMIT 1`,
      [studentId],
    );
    return row ?? null;
  }

  /** Checkpoint tries per topic for a student (topics without tries are absent). */
  async checkpointStats(
    studentId: number,
    topicIds?: number[],
  ): Promise<Map<number, CheckpointStats>> {
    const rows: (CheckpointStats & { topicId: number })[] =
      await this.dataSource.query(
        `SELECT topic_id AS "topicId",
                count(*) FILTER (WHERE result IS NOT NULL)::int AS tries,
                (array_agg(result ORDER BY id DESC) FILTER (WHERE result IS NOT NULL))[1] AS "lastResult",
                max(judged_at) AS "lastTriedAt",
                count(*) FILTER (WHERE result = 'not_yet' AND id > COALESCE(last_pass, 0))::int AS "notYetSinceLastPass",
                max(id) FILTER (WHERE result IS NULL) AS "openCheckpointId"
           FROM (SELECT *, max(id) FILTER (WHERE result = 'passed') OVER (PARTITION BY topic_id) AS last_pass
                   FROM checkpoint_attempts
                  WHERE student_id = $1 AND ($2::int[] IS NULL OR topic_id = ANY($2))) tries
          GROUP BY topic_id`,
        [studentId, topicIds ?? null],
      );
    return new Map(rows.map(({ topicId, ...stats }) => [topicId, stats]));
  }

  /** One topic's mastery status, including needs_help from checkpoint tries. */
  async topicStatus(
    studentId: number,
    topicId: number,
  ): Promise<MasteryStatus> {
    const [row] = await this.dataSource.query(
      `SELECT is_mastered, home_score FROM topic_mastery WHERE student_id = $1 AND topic_id = $2`,
      [studentId, topicId],
    );
    const stats = (await this.checkpointStats(studentId, [topicId])).get(
      topicId,
    );
    return masteryStatus(row, stats?.notYetSinceLastPass);
  }

  /** The topics before and after this one in its textbook (chapter number, then position). */
  async neighbours(topicId: number): Promise<{
    prev: { topicId: number; title: string } | null;
    next: { topicId: number; title: string } | null;
  }> {
    const rows: { topicId: number; title: string; side: "prev" | "next" }[] =
      await this.dataSource.query(
        `WITH ordered AS (
           SELECT topic.id, topic.title, chapter.textbook_id,
                  row_number() OVER (PARTITION BY chapter.textbook_id
                                     ORDER BY chapter.number NULLS LAST, topic.position NULLS LAST, topic.id) AS n
             FROM topics topic JOIN chapters chapter ON chapter.id = topic.chapter_id)
         SELECT other.id AS "topicId", other.title,
                CASE WHEN other.n < current.n THEN 'prev' ELSE 'next' END AS side
           FROM ordered current
           JOIN ordered other ON other.textbook_id = current.textbook_id
                             AND other.n IN (current.n - 1, current.n + 1)
          WHERE current.id = $1`,
        [topicId],
      );
    const pick = (side: "prev" | "next") => {
      const row = rows.find((r) => r.side === side);
      return row ? { topicId: row.topicId, title: row.title } : null;
    };
    return { prev: pick("prev"), next: pick("next") };
  }

  /** The topic when it belongs to the student's class subjects and grade, else null. */
  async topicFor(
    topicId: number,
    studentId: number,
  ): Promise<StudentTopic | null> {
    const studentClass = await this.classOf(studentId);
    if (!studentClass) return null;
    const [topic] = await this.dataSource.query(
      `SELECT topic.id, topic.title, textbook.subject_id, topic.key_ideas, $3::int AS class_id
         FROM topics topic
         JOIN chapters chapter ON chapter.id = topic.chapter_id
         JOIN textbooks textbook ON textbook.id = chapter.textbook_id
        WHERE topic.id = $1 AND textbook.grade = $2
          AND textbook.subject_id IN (SELECT subject_id FROM teacher_assignments WHERE class_id = $3)`,
      [topicId, studentClass.grade, studentClass.id],
    );
    return topic ?? null;
  }

  /** Every lesson quiz of the student's class (linked through homework), with its state for this student. */
  async quizzesOf(
    studentId: number,
    now = new Date(),
  ): Promise<StudentQuizDto[]> {
    const studentClass = await this.classOf(studentId);
    if (!studentClass) return [];
    const rows: QuizRow[] = await this.dataSource.query(
      `SELECT DISTINCT ON (quiz.id)
              quiz.id AS "quizId", quiz.title, quiz.topic_id AS "topicId", topic.title AS "topicTitle",
              subject.id AS "subjectId", subject.name AS "subjectName",
              lesson.id AS "lessonId", lesson.date::text AS "lessonDate",
              COALESCE(lesson.ended_at, (lesson.date + COALESCE(slot.ends_at, time '23:59')) AT TIME ZONE $2) AS "unlocksAt",
              homework.due_at AS "dueAt",
              attempt.id AS "attemptId", attempt.started_at AS "startedAt",
              attempt.finished_at AS "finishedAt", attempt.score_percent AS "scorePercent"
         FROM homework
         JOIN quizzes quiz ON quiz.id = homework.quiz_id
         JOIN lessons lesson ON lesson.id = homework.lesson_id
         JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
         JOIN subjects subject ON subject.id = assignment.subject_id
         LEFT JOIN timetable_slots slot ON slot.id = lesson.timetable_slot_id
         LEFT JOIN topics topic ON topic.id = quiz.topic_id
         LEFT JOIN LATERAL (
              SELECT id, started_at, finished_at, score_percent FROM attempts
               WHERE quiz_id = quiz.id AND student_id = $3 AND mode = 'home'
               ORDER BY id DESC LIMIT 1) attempt ON true
        WHERE assignment.class_id = $1
        ORDER BY quiz.id, homework.id`,
      [studentClass.id, appTimezone(), studentId],
    );
    return rows
      .map((row) => this.toQuiz(row, now))
      .sort(
        (a, b) =>
          (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity) ||
          a.quizId - b.quizId,
      );
  }

  async quizzes(studentId: number): Promise<QuizListDto> {
    const all = await this.quizzesOf(studentId);
    return {
      available: all.filter((q) => q.status === StudentQuizStatus.AVAILABLE),
      done: all.filter((q) => q.status === StudentQuizStatus.DONE),
      overdue: all.filter((q) => q.status === StudentQuizStatus.OVERDUE),
    };
  }

  async today(studentId: number): Promise<TodayDto> {
    const now = new Date();
    const date = localDate(now);
    const timezone = appTimezone();
    const studentClass = await this.classOf(studentId);
    if (!studentClass) {
      return { date, timezone, class: null, lessons: [], quizzes: [] };
    }
    const quizzes = await this.quizzesOf(studentId, now);
    const quizByLesson = new Map(quizzes.map((q) => [q.lessonId, q]));
    const rows: {
      lessonId: number;
      period: number | null;
      startsAt: string | null;
      endsAt: string | null;
      startAt: Date;
      endAt: Date;
      subjectId: number;
      subjectName: string;
      topicId: number | null;
      topicTitle: string | null;
      teacherId: number;
      firstName: string;
      lastName: string;
      room: string | null;
    }[] = await this.dataSource.query(
      `SELECT lesson.id AS "lessonId", slot.period,
              to_char(slot.starts_at, 'HH24:MI') AS "startsAt", to_char(slot.ends_at, 'HH24:MI') AS "endsAt",
              (lesson.date + COALESCE(slot.starts_at, time '00:00')) AT TIME ZONE $3 AS "startAt",
              COALESCE(lesson.ended_at, (lesson.date + COALESCE(slot.ends_at, time '23:59')) AT TIME ZONE $3) AS "endAt",
              subject.id AS "subjectId", subject.name AS "subjectName",
              topic.id AS "topicId", topic.title AS "topicTitle",
              teacher.id AS "teacherId", teacher.first_name AS "firstName", teacher.last_name AS "lastName",
              room.name AS room
         FROM lessons lesson
         JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
         JOIN subjects subject ON subject.id = assignment.subject_id
         JOIN users teacher ON teacher.id = assignment.teacher_id
         LEFT JOIN timetable_slots slot ON slot.id = lesson.timetable_slot_id
         LEFT JOIN rooms room ON room.id = slot.room_id
         LEFT JOIN topics topic ON topic.id = lesson.topic_id
        WHERE assignment.class_id = $1 AND lesson.date = $2
        ORDER BY slot.period NULLS LAST, slot.starts_at NULLS LAST, lesson.id`,
      [studentClass.id, date, timezone],
    );
    const lessons: TodayLessonDto[] = rows.map((row) => ({
      lessonId: row.lessonId,
      period: row.period,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status:
        now < row.startAt
          ? LessonStatus.UPCOMING
          : now >= row.endAt
            ? LessonStatus.FINISHED
            : LessonStatus.IN_PROGRESS,
      subject: { id: row.subjectId, name: row.subjectName },
      topic: row.topicId ? { id: row.topicId, title: row.topicTitle! } : null,
      teacher: {
        id: row.teacherId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
      room: row.room,
      quiz: quizByLesson.get(row.lessonId) ?? null,
    }));
    return {
      date,
      timezone,
      class: {
        id: studentClass.id,
        name: `${studentClass.grade}-${studentClass.letter}`,
      },
      lessons,
      quizzes: quizzes.filter((q) => q.status === StudentQuizStatus.AVAILABLE),
    };
  }

  /** Every topic of the textbooks for the subjects taught to the student's class, with its status. */
  async mastery(studentId: number): Promise<MasteryListDto> {
    const rule = MASTERY_RULE;
    const studentClass = await this.classOf(studentId);
    if (!studentClass) return { rule, topics: [] };
    const rows: {
      topicId: number;
      textbookId: number;
      subjectId: number;
      chapterId: number;
      chapterPosition: number | null;
      title: string;
      chapter: string | null;
      subject: string;
      mastery: number | null;
      home_score: string | null;
      exam_score: string | null;
      is_mastered: boolean | null;
      updated_at: Date | null;
      has_row: boolean;
    }[] = await this.dataSource.query(
      `SELECT topic.id AS "topicId", textbook.id AS "textbookId", subject.id AS "subjectId",
              chapter.id AS "chapterId", chapter.number AS "chapterPosition", topic.title, chapter.title AS chapter,
              subject.name AS subject, progress.mastery, progress.home_score, progress.exam_score,
              progress.is_mastered, progress.updated_at, progress.id IS NOT NULL AS has_row
         FROM topics topic
         JOIN chapters chapter ON chapter.id = topic.chapter_id
         JOIN textbooks textbook ON textbook.id = chapter.textbook_id
         JOIN subjects subject ON subject.id = textbook.subject_id
         LEFT JOIN topic_mastery progress ON progress.topic_id = topic.id AND progress.student_id = $1
        WHERE textbook.grade = $2
          AND textbook.subject_id IN (SELECT subject_id FROM teacher_assignments WHERE class_id = $3)
        ORDER BY subject.name, textbook.id, chapter.number NULLS LAST, topic.position NULLS LAST, topic.id`,
      [studentId, studentClass.grade, studentClass.id],
    );
    const checkpoints = await this.checkpointStats(studentId);
    const number = (v: string | number | null) =>
      v === null ? null : Number(v);
    // Book order: a topic is unlocked when it is the first of its textbook, the one before is
    // mastered, or it is mastered itself (the timetable may teach topics out of book order).
    let previous: { textbookId: number; mastered: boolean } | null = null;
    return {
      rule,
      topics: rows.map((row) => {
        const stats = checkpoints.get(row.topicId);
        const status = masteryStatus(
          row.has_row ? row : undefined,
          stats?.notYetSinceLastPass,
        );
        const unlocked =
          status === MasteryStatus.MASTERED ||
          previous?.textbookId !== row.textbookId ||
          previous.mastered;
        previous = {
          textbookId: row.textbookId,
          mastered: status === MasteryStatus.MASTERED,
        };
        return {
          topicId: row.topicId,
          title: row.title,
          subjectId: row.subjectId,
          subject: row.subject,
          chapterId: row.chapterId,
          chapterPosition: row.chapterPosition,
          chapter: row.chapter,
          status,
          unlocked,
          checkpointTries: stats?.tries ?? 0,
          mastery: row.mastery,
          homeScore: number(row.home_score),
          examScore: number(row.exam_score),
          updatedAt: row.updated_at,
        };
      }),
    };
  }

  private toQuiz(row: QuizRow, now: Date): StudentQuizDto {
    let status: StudentQuizStatus;
    if (row.finishedAt) status = StudentQuizStatus.DONE;
    else if (now < row.unlocksAt) status = StudentQuizStatus.LOCKED;
    else if (row.dueAt && now > row.dueAt) status = StudentQuizStatus.OVERDUE;
    else status = StudentQuizStatus.AVAILABLE;
    return {
      quizId: row.quizId,
      title: row.title,
      topic: row.topicId ? { id: row.topicId, title: row.topicTitle! } : null,
      subject: { id: row.subjectId, name: row.subjectName },
      lessonId: row.lessonId,
      lessonDate: row.lessonDate,
      unlocksAt: row.unlocksAt,
      dueAt: row.dueAt,
      status,
      attempt: row.attemptId
        ? {
            id: row.attemptId,
            startedAt: row.startedAt!,
            finishedAt: row.finishedAt,
            scorePercent:
              row.scorePercent === null ? null : Number(row.scorePercent),
          }
        : null,
    };
  }
}
