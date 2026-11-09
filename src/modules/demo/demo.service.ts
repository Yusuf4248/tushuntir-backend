import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { LessonsService } from "../daily/lessons/lessons.service";

/** A demo quiz must stay open for at least this long after the lesson is ended. */
const MIN_OPEN_MS = 60 * 60 * 1000;
const EXTENDED_OPEN_MS = 2 * 60 * 60 * 1000;

export function demoModeEnabled(): boolean {
  return process.env.DEMO_MODE?.trim() === "true";
}

@Injectable()
export class DemoService {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly dataSource: DataSource,
  ) {}

  async finishLesson(lessonId: number, user: AuthUser) {
    if (!demoModeEnabled()) throw new NotFoundException();
    // Scope check: users outside the lesson's school get a 404.
    const lesson = await this.lessonsService.findOne(lessonId, user);
    const endedAt = lesson.endedAt ?? new Date();
    if (!lesson.endedAt) {
      await this.dataSource.query(
        `UPDATE lessons SET ended_at = $1 WHERE id = $2`,
        [endedAt, lessonId],
      );
    }
    const [homework]: {
      quiz_id: number;
      title: string | null;
      due_at: Date | null;
    }[] = await this.dataSource.query(
      `SELECT homework.quiz_id, quiz.title, homework.due_at
         FROM homework JOIN quizzes quiz ON quiz.id = homework.quiz_id
        WHERE homework.lesson_id = $1
        ORDER BY homework.id LIMIT 1`,
      [lessonId],
    );
    let dueAt = homework?.due_at ?? null;
    if (homework && (!dueAt || dueAt.getTime() < Date.now() + MIN_OPEN_MS)) {
      dueAt = new Date(Date.now() + EXTENDED_OPEN_MS);
      await this.dataSource.query(
        `UPDATE homework SET due_at = $1 WHERE lesson_id = $2 AND quiz_id = $3`,
        [dueAt, lessonId, homework.quiz_id],
      );
    }
    return {
      lessonId,
      endedAt,
      quiz: homework
        ? { id: homework.quiz_id, title: homework.title, dueAt }
        : null,
    };
  }
}
