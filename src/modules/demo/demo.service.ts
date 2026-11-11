import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { UserRole } from "../../common/enums";

/** A demo quiz must stay open for at least this long after the lesson is ended. */
const MIN_OPEN_MS = 60 * 60 * 1000;
const EXTENDED_OPEN_MS = 2 * 60 * 60 * 1000;

export function demoModeEnabled(): boolean {
  return process.env.DEMO_MODE?.trim() === "true";
}

@Injectable()
export class DemoService {
  constructor(private readonly dataSource: DataSource) {}

  async finishLesson(lessonId: number, user: AuthUser) {
    if (!demoModeEnabled()) throw new NotFoundException();
    // A student may end a lesson of their own class, a teacher only their own lesson; others get 404.
    const [lesson]: { ended_at: Date | null }[] = await this.dataSource.query(
      `SELECT lesson.ended_at
         FROM lessons lesson
         JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
        WHERE lesson.id = $1
          AND (($2 = $3 AND assignment.teacher_id = $5)
            OR ($2 = $4 AND EXISTS (SELECT 1 FROM class_students enrolment
                                     WHERE enrolment.class_id = assignment.class_id
                                       AND enrolment.student_id = $5)))`,
      [lessonId, user.role, UserRole.TEACHER, UserRole.STUDENT, user.id],
    );
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);
    const endedAt = lesson.ended_at ?? new Date();
    if (!lesson.ended_at) {
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
