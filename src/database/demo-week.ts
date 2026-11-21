/**
 * The demo week: lessons of the current week from the class timetable, with the algebra topics
 * in book order and a lesson quiz (homework row) for each algebra lesson. Used by seed:mvp and by
 * the app's daily demo job (DemoWeekJob). No AI calls.
 */
import { EntityManager } from "typeorm";
import { addDays, appTimezone, quizDeadlineTime } from "../common/school-time";
import { upsert } from "./upsert";

export const DEMO_SCHOOL_NAME = "21-maktab (demo)";

/** First shift: period → [starts, ends] (school time). */
export const DEMO_PERIODS: Record<number, [string, string]> = {
  1: ["08:00", "08:45"],
  2: ["08:55", "09:40"],
  3: ["09:50", "10:35"],
  4: ["10:45", "11:30"],
  5: ["11:40", "12:25"],
};

export interface AlgebraTopic {
  id: number;
  title: string;
}

/** Grade 7 algebra topics in book order (empty before content:load). */
export function algebraTopics(manager: EntityManager): Promise<AlgebraTopic[]> {
  return manager.query(
    `SELECT topic.id, topic.title
       FROM topics topic
       JOIN chapters chapter ON chapter.id = topic.chapter_id
       JOIN textbooks textbook ON textbook.id = chapter.textbook_id
       JOIN subjects subject ON subject.id = textbook.subject_id
      WHERE subject.code = 'ALGEBRA' AND textbook.grade = 7
      ORDER BY chapter.number, topic.position`,
  );
}

/** Class 7-A of the demo school, or null when seed:mvp has not run. */
export async function demoClassId(
  manager: EntityManager,
): Promise<number | null> {
  const [row] = await manager.query(
    `SELECT class.id FROM classes class JOIN schools school ON school.id = class.school_id
      WHERE school.name = $1 AND class.grade = 7 AND class.letter = 'A'
      ORDER BY class.id DESC LIMIT 1`,
    [DEMO_SCHOOL_NAME],
  );
  return row?.id ?? null;
}

export interface WeekResult {
  created: number;
  quizzes: { lessonId: number; quizId: number; topic: string }[];
}

/**
 * Lessons for the week starting `monday`, from the class's timetable slots, on term days only.
 * update false (the daily job): only missing lessons are created, existing ones are left as they
 * are (a deadline moved by finish-lesson stays). update true (seed:mvp): existing lessons also
 * get their topic and lesson quiz refreshed.
 */
export async function ensureWeekLessons(
  manager: EntityManager,
  input: { classId: number; monday: string; update: boolean },
): Promise<WeekResult> {
  const topics = await algebraTopics(manager);
  const slots: {
    id: number;
    weekday: number;
    assignmentId: number;
    teacherId: number;
    subjectCode: string | null;
  }[] = await manager.query(
    `SELECT DISTINCT ON (slot.weekday, slot.period)
            slot.id, slot.weekday, slot.teacher_assignment_id AS "assignmentId",
            assignment.teacher_id AS "teacherId", subject.code AS "subjectCode"
       FROM timetable_slots slot
       JOIN teacher_assignments assignment ON assignment.id = slot.teacher_assignment_id
       JOIN subjects subject ON subject.id = assignment.subject_id
      WHERE assignment.class_id = $1
      ORDER BY slot.weekday, slot.period, slot.id DESC`,
    [input.classId],
  );
  const terms: { starts_on: string; ends_on: string }[] = await manager.query(
    `SELECT term.starts_on::text, term.ends_on::text FROM terms term
       JOIN classes class ON class.academic_year_id = term.academic_year_id
      WHERE class.id = $1 AND term.starts_on IS NOT NULL AND term.ends_on IS NOT NULL`,
    [input.classId],
  );
  const inTerm = (date: string) =>
    terms.some((t) => t.starts_on <= date && date <= t.ends_on);

  const deadline = quizDeadlineTime();
  const result: WeekResult = { created: 0, quizzes: [] };
  let algebraLesson = 0;
  for (const slot of slots) {
    const date = addDays(input.monday, slot.weekday - 1);
    // Topics follow the algebra slots of the week in order, whether or not the lesson exists.
    const topic =
      slot.subjectCode === "ALGEBRA" && topics.length
        ? topics[algebraLesson++ % topics.length]
        : null;
    if (!inTerm(date)) continue;
    const [existing] = await manager.query(
      `SELECT id FROM lessons WHERE teacher_assignment_id = $1 AND timetable_slot_id = $2 AND date = $3`,
      [slot.assignmentId, slot.id, date],
    );
    if (existing && !input.update) continue;
    const lessonId = existing
      ? (await upsert(
          manager,
          "lessons",
          { id: existing.id },
          { topic_id: topic?.id ?? null },
        ),
        existing.id as number)
      : (
          await manager.query(
            `INSERT INTO lessons (teacher_assignment_id, timetable_slot_id, date, topic_id)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [slot.assignmentId, slot.id, date, topic?.id ?? null],
          )
        )[0].id;
    if (!existing) result.created++;
    if (topic) {
      const quizId = await lessonQuiz(manager, {
        lessonId,
        classId: input.classId,
        topic,
        date,
        deadline,
        teacherId: slot.teacherId,
      });
      result.quizzes.push({ lessonId, quizId, topic: topic.title });
    }
  }
  return result;
}

/** The lesson's quiz on its topic and the homework row that links lesson → quiz → deadline. */
export async function lessonQuiz(
  manager: EntityManager,
  input: {
    lessonId: number;
    classId: number;
    topic: AlgebraTopic;
    date: string;
    deadline: string;
    teacherId: number;
  },
): Promise<number> {
  const [{ due }] = await manager.query(
    `SELECT ($1::date + $2::time) AT TIME ZONE $3 AS due`,
    [input.date, input.deadline, appTimezone()],
  );
  const [homework] = await manager.query(
    `SELECT id, quiz_id FROM homework WHERE lesson_id = $1 AND quiz_id IS NOT NULL ORDER BY id LIMIT 1`,
    [input.lessonId],
  );
  const quiz = {
    topic_id: input.topic.id,
    class_id: input.classId,
    kind: "homework",
    title: `${input.topic.title}: dars bo'yicha test`,
    shuffle_questions: true,
    created_by: input.teacherId,
  };
  if (homework) {
    await upsert(manager, "quizzes", { id: homework.quiz_id }, quiz);
    await upsert(manager, "homework", { id: homework.id }, { due_at: due });
    return homework.quiz_id;
  }
  const [{ id: quizId }] = await manager.query(
    `INSERT INTO quizzes (topic_id, class_id, kind, title, shuffle_questions, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      quiz.topic_id,
      quiz.class_id,
      quiz.kind,
      quiz.title,
      quiz.shuffle_questions,
      quiz.created_by,
    ],
  );
  await upsert(
    manager,
    "homework",
    { lesson_id: input.lessonId, quiz_id: quizId },
    {
      title: "Dars bo'yicha test",
      description:
        "Darsdan keyin ochiladi; 10 ta savol, yordamchi maslahatlar bilan.",
      due_at: due,
      created_by: input.teacherId,
    },
  );
  return quizId;
}
