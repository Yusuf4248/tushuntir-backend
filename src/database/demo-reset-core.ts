/**
 * The demo reset, shared by `npm run demo:reset` and the app's nightly DemoWeekJob (00:10 school
 * time, DEMO_MODE only). For each demo student it deletes their quiz attempts, the practice
 * quizzes they created, checkpoint tries, topic mastery, chat sessions and the needs_help
 * notifications about them, reopens this week's lessons of their class (ended_at cleared, quiz
 * deadlines back to QUIZ_DEADLINE_TIME), deletes their homework submissions from this week and
 * their notifications from the last 30 days (rebuilt unread on the next read), puts the four demo
 * homework items back, and sets up the demo progress (seedDemoProgress): today's open Algebra
 * task, earlier quizzes submitted, the first topics mastered.
 * History is kept: attendance, grades, the seeded notifications and older submissions; also
 * generated questions and textbook content.
 *
 * The demo students: the main one (DEMO_STUDENT_PHONE) and the next DEMO_EXTRA_STUDENTS existing
 * students of the same class by phone number, all put in the same state.
 */
import { EntityManager } from "typeorm";
import {
  addDays,
  appTimezone,
  isoWeekday,
  localDate,
  quizDeadlineTime,
} from "../common/school-time";
import { DemoProgressSummary, seedDemoProgress } from "./demo-progress";
import { demoClassId } from "./demo-week";
import {
  DEMO_STUDENT_PHONE,
  removeSubmissionFiles,
  seedDemoHomework,
} from "./demo-school";

/** Existing students of the demo class reset together with the main demo student. */
export const DEMO_EXTRA_STUDENTS = 2;

export interface DemoStudent {
  id: number;
  name: string;
  phone: string;
}

export interface StudentReset {
  student: DemoStudent;
  counts: Record<string, number | string>;
  progress: DemoProgressSummary | null;
}

/**
 * The main demo student and the next DEMO_EXTRA_STUDENTS students of their class, only when the
 * main one is in the demo school's 7-A; otherwise none (a real school is never touched).
 */
export async function demoStudents(
  manager: EntityManager,
): Promise<DemoStudent[]> {
  const classId = await demoClassId(manager);
  if (!classId) return [];
  const rows: (DemoStudent & { main: boolean })[] = await manager.query(
    `SELECT student.id, concat_ws(' ', student.first_name, student.last_name) AS name,
            student.phone, student.phone = $2 AS main
       FROM class_students enrolment
       JOIN users student ON student.id = enrolment.student_id
      WHERE enrolment.class_id = $1 AND student.role = 'student'
        AND student.is_active IS NOT FALSE
      ORDER BY main DESC, student.phone, student.id
      LIMIT $3`,
    [classId, DEMO_STUDENT_PHONE, DEMO_EXTRA_STUDENTS + 1],
  );
  if (!rows[0]?.main) return [];
  return rows.map(({ id, name, phone }) => ({ id, name, phone }));
}

export async function findStudents(
  manager: EntityManager,
  phones: string[],
): Promise<DemoStudent[]> {
  return manager.query(
    `SELECT id, concat_ws(' ', first_name, last_name) AS name, phone FROM users
      WHERE phone = ANY($1) AND role = 'student' ORDER BY phone`,
    [phones],
  );
}

/**
 * Resets the given students (default: the demo students). Runs in the caller's transaction;
 * returns the uploaded files of removed submissions, to delete after the commit.
 */
export async function resetDemoStudents(
  manager: EntityManager,
  input: { now?: Date; students?: DemoStudent[] } = {},
): Promise<{ students: StudentReset[]; removedFiles: string[] }> {
  const now = input.now ?? new Date();
  const students = input.students ?? (await demoStudents(manager));
  const removedFiles: string[] = [];
  const results: StudentReset[] = [];
  for (const student of students) {
    results.push(await resetStudent(manager, student, now, removedFiles));
  }
  return { students: results, removedFiles };
}

async function resetStudent(
  manager: EntityManager,
  student: DemoStudent,
  now: Date,
  removedFiles: string[],
): Promise<StudentReset> {
  const today = localDate(now);
  const monday = addDays(today, 1 - isoWeekday(today));
  const sunday = addDays(monday, 6);
  const run = async (sql: string, params: unknown[]): Promise<number> => {
    const result = await manager.query(sql, params);
    // DELETE / UPDATE come back as [rows, affected count].
    return Array.isArray(result) && typeof result[1] === "number"
      ? result[1]
      : 0;
  };
  const id = student.id;
  const [enrolment] = await manager.query(
    `SELECT class_id FROM class_students WHERE student_id = $1 ORDER BY id DESC LIMIT 1`,
    [id],
  );
  let progress: DemoProgressSummary | null = null;
  const counts: Record<string, number | string> = {
    // attempt_answers go with their attempts (ON DELETE CASCADE)
    "quiz attempts": await run(`DELETE FROM attempts WHERE student_id = $1`, [
      id,
    ]),
    "practice quizzes": await run(
      `DELETE FROM quizzes quiz WHERE quiz.kind = 'practice' AND quiz.created_by = $1
          AND NOT EXISTS (SELECT 1 FROM attempts WHERE quiz_id = quiz.id)`,
      [id],
    ),
    "checkpoint tries": await run(
      `DELETE FROM checkpoint_attempts WHERE student_id = $1`,
      [id],
    ),
    "topic mastery rows": await run(
      `DELETE FROM topic_mastery WHERE student_id = $1`,
      [id],
    ),
    // ai_messages go with their sessions (ON DELETE CASCADE)
    "chat sessions": await run(
      `DELETE FROM ai_sessions WHERE student_id = $1`,
      [id],
    ),
    "needs_help notifications": student.name
      ? await run(
          `DELETE FROM notifications WHERE type = 'needs_help' AND body LIKE $1 || ' %'`,
          [student.name],
        )
      : 0,
    "lessons reopened": await run(
      `UPDATE lessons lesson SET ended_at = NULL
         FROM teacher_assignments assignment
        WHERE assignment.id = lesson.teacher_assignment_id
          AND assignment.class_id IN (SELECT class_id FROM class_students WHERE student_id = $1)
          AND lesson.date BETWEEN $2 AND $3 AND lesson.ended_at IS NOT NULL`,
      [id, monday, sunday],
    ),
    // finish-lesson may have moved a deadline; put it back to the lesson day.
    "quiz deadlines restored": await run(
      `UPDATE homework SET due_at = (lesson.date + $4::time) AT TIME ZONE $5
         FROM lessons lesson
         JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
        WHERE homework.lesson_id = lesson.id AND homework.quiz_id IS NOT NULL
          AND assignment.class_id IN (SELECT class_id FROM class_students WHERE student_id = $1)
          AND lesson.date BETWEEN $2 AND $3
          AND homework.due_at IS DISTINCT FROM (lesson.date + $4::time) AT TIME ZONE $5`,
      [id, monday, sunday, quizDeadlineTime(), appTimezone()],
    ),
    // The app rebuilds grade / homework / quiz notifications from the data on the next read
    // (looking back up to 30 days), so they come back unread; the seeded ones stay.
    "notifications (last 30 days)": await run(
      `DELETE FROM notifications WHERE user_id = $1 AND data->>'seed' IS NULL
          AND created_at >= $2::timestamptz - interval '30 days'`,
      [id, now],
    ),
    "submissions from this week": await (async () => {
      const rows: { homework_id: number }[] = await manager.query(
        `SELECT homework_id FROM homework_submissions WHERE student_id = $1
            AND submitted_at >= ($2::date + time '00:00') AT TIME ZONE $3`,
        [id, monday, appTimezone()],
      );
      for (const row of rows) {
        removedFiles.push(
          ...(await removeSubmissionFiles(manager, row.homework_id, id)),
        );
        await manager.query(
          `DELETE FROM homework_submissions WHERE homework_id = $1 AND student_id = $2`,
          [row.homework_id, id],
        );
      }
      return rows.length;
    })(),
    "demo homework restored": await (async () => {
      if (!enrolment) return 0;
      const result = await seedDemoHomework(manager, {
        classId: enrolment.class_id,
        studentId: id,
        now,
      });
      removedFiles.push(...result.removedFiles);
      return result.items.length;
    })(),
    // Last, after the steps above reopened this week's lessons and reset their deadlines.
    "demo progress": await (async () => {
      if (!enrolment) return "no class";
      progress = await seedDemoProgress(manager, {
        classId: enrolment.class_id,
        studentId: id,
        now,
      });
      return `${progress.submitted} quizzes submitted, ${progress.overdue} overdue`;
    })(),
  };
  return { student, counts, progress };
}

/** One line about today's task, for logs. */
export function describeProgress(p: DemoProgressSummary | null): string {
  if (!p) return "no class";
  const lesson = p.todayLesson;
  return lesson
    ? `today (${p.today}) Algebra lesson ${lesson.lessonId}${lesson.period ? ` (period ${lesson.period})` : ""}` +
        ` on "${lesson.topic}", quiz ${lesson.quizId} open until tonight` +
        (p.slotAdded ? "; an Algebra slot was added to this weekday" : "")
    : `today (${p.today}): no demo lesson`;
}
