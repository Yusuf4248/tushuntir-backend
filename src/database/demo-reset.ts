/**
 * npm run demo:reset [-- <student phone>]
 * Puts the demo student back to a fresh start so the demo can be run (and recorded) again:
 * deletes their quiz attempts, the practice quizzes they created, checkpoint tries, topic
 * mastery, chat sessions and the needs_help notifications about them, and reopens this week's
 * lessons of their class (ended_at cleared, quiz deadlines back to QUIZ_DEADLINE_TIME on the
 * lesson day). Generated questions, confirmation questions and textbook content are kept.
 *
 * Only runs with DEMO_MODE=true. Uses DATABASE_URL when set (e.g. production), else PG_*.
 * Default student: the first demo student of seed:mvp.
 */
import {
  addDays,
  appTimezone,
  isoWeekday,
  localDate,
  quizDeadlineTime,
} from "../common/school-time";
import dataSource from "./data-source";

const DEFAULT_STUDENT_PHONE = "+998901001001";

/** The database name only, never the host or the credentials. */
function databaseName(): string {
  const options = dataSource.options as { url?: string; database?: string };
  if (options.url) return new URL(options.url).pathname.replace(/^\//, "");
  return options.database ?? "?";
}

async function main() {
  if (process.env.DEMO_MODE?.trim() !== "true") {
    throw new Error("refusing to run: DEMO_MODE is not true");
  }
  const phone = process.argv[2]?.trim() || DEFAULT_STUDENT_PHONE;
  await dataSource.initialize();
  try {
    const [student]: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    }[] = await dataSource.query(
      `SELECT id, first_name, last_name FROM users WHERE phone = $1 AND role = 'student'`,
      [phone],
    );
    if (!student) throw new Error(`no student with phone ${phone}`);
    const name = [student.first_name, student.last_name]
      .filter(Boolean)
      .join(" ");
    const monday = addDays(localDate(), 1 - isoWeekday(localDate()));
    const sunday = addDays(monday, 6);
    console.log(
      `Resetting ${name || "student"} (id ${student.id}) in database "${databaseName()}", week ${monday} to ${sunday}`,
    );

    const counts = await dataSource.transaction(async (manager) => {
      const run = async (sql: string, params: unknown[]): Promise<number> => {
        const result = await manager.query(sql, params);
        // DELETE / UPDATE come back as [rows, affected count].
        return Array.isArray(result) && typeof result[1] === "number"
          ? result[1]
          : 0;
      };
      const id = student.id;
      return {
        // attempt_answers go with their attempts (ON DELETE CASCADE)
        "quiz attempts": await run(
          `DELETE FROM attempts WHERE student_id = $1`,
          [id],
        ),
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
        "needs_help notifications": name
          ? await run(
              `DELETE FROM notifications WHERE type = 'needs_help' AND body LIKE $1 || ' %'`,
              [name],
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
      };
    });
    for (const [label, count] of Object.entries(counts)) {
      console.log(`  ${label}: ${count}`);
    }
    console.log(
      "Done. Generated questions and textbook content were not touched.",
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`demo:reset failed: ${error.message}`);
  process.exit(1);
});
