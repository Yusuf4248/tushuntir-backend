/**
 * The demo student's learning progress, put in place by demo:reset and seed:mvp so the demo
 * looks like a real school week on any day, weekends included:
 *  - today has an Algebra lesson (Saturday gets an Algebra timetable slot after its last period;
 *    on Sunday, which the schema allows no slots for, a lesson is held on the week's earliest
 *    Algebra slot), ended, on the student's next unmastered topic, with an open lesson quiz due
 *    today at QUIZ_DEADLINE_TIME;
 *  - earlier Algebra lessons cover the topics before it, in book order, and their quizzes are
 *    submitted with scores and quiz grades, except at most one left overdue;
 *  - the topics before today's are mastered (quiz score 80%+ and a passed checkpoint), so the
 *    student's progress is 2 of 6, today's topic is unlocked and its checkpoint is available
 *    after the quiz as in the normal flow.
 * Deterministic: running it again gives the same state. Demo data only; no app logic changes.
 */
import { EntityManager } from "typeorm";
import {
  addDays,
  appTimezone,
  isoWeekday,
  localDate,
  quizDeadlineTime,
} from "../common/school-time";
import { QUESTIONS_PER_ATTEMPT } from "../modules/me/me.types";
import {
  algebraTopics,
  AlgebraTopic,
  DEMO_PERIODS,
  ensureWeekLessons,
  lessonQuiz,
} from "./demo-week";
import { upsert } from "./upsert";

/** Topics in book order the demo student has mastered; the next one is today's. */
export const DEMO_MASTERED_TOPICS = 2;

/** Scores of the submitted demo quizzes, in lesson order (the last on each topic is 90+). */
const SCORES = [70, 80, 90, 100, 80, 90];

interface AlgebraLesson {
  id: number;
  date: string;
  period: number | null;
  startsAt: Date;
  endsAt: Date | null;
  teacherAssignmentId: number;
  teacherId: number;
}

export interface DemoProgressSummary {
  today: string;
  todayLesson: {
    lessonId: number;
    quizId: number;
    topic: string;
    period: number | null;
  } | null;
  slotAdded: boolean;
  submitted: number;
  overdue: number;
  mastered: string[];
}

/** A stable number in [0, 1) for a key (FNV-1a). */
function unit(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

const gradeFor = (score: number) =>
  score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : 2;

export async function seedDemoProgress(
  manager: EntityManager,
  input: { classId: number; studentId: number; now?: Date },
): Promise<DemoProgressSummary> {
  const now = input.now ?? new Date();
  const timezone = appTimezone();
  const today = localDate(now);
  const weekday = isoWeekday(today);
  const monday = addDays(today, 1 - weekday);
  const summary: DemoProgressSummary = {
    today,
    todayLesson: null,
    slotAdded: false,
    submitted: 0,
    overdue: 0,
    mastered: [],
  };
  const topics = await algebraTopics(manager);
  const [algebra]: { id: number; teacher_id: number }[] = await manager.query(
    `SELECT assignment.id, assignment.teacher_id
       FROM teacher_assignments assignment JOIN subjects subject ON subject.id = assignment.subject_id
      WHERE assignment.class_id = $1 AND subject.code = 'ALGEBRA'
      ORDER BY assignment.id LIMIT 1`,
    [input.classId],
  );
  if (!algebra || !topics.length) return summary;

  // 1. Saturday has no Algebra in the timetable: add a slot after the day's last period. (The
  //    schema allows slots on Monday to Saturday only; Sunday is handled in step 2.)
  if (weekday <= 6) {
    summary.slotAdded = await ensureAlgebraSlot(manager, algebra.id, weekday);
  }
  // 2. This week's lessons (today's included) from the timetable. If today still has no Algebra
  //    lesson (Sunday, or a day outside a term), one is held today on today's Algebra slot, else
  //    on the week's earliest one; the lesson's date, not its slot, puts it on today.
  await ensureWeekLessons(manager, {
    classId: input.classId,
    monday,
    update: false,
  });
  const [heldToday] = await manager.query(
    `SELECT id FROM lessons WHERE teacher_assignment_id = $1 AND date = $2 LIMIT 1`,
    [algebra.id, today],
  );
  if (!heldToday) {
    await manager.query(
      `INSERT INTO lessons (teacher_assignment_id, timetable_slot_id, date)
       SELECT $1, slot.id, $2 FROM timetable_slots slot
        WHERE slot.teacher_assignment_id = $1
        ORDER BY (slot.weekday = $3) DESC, slot.starts_at NULLS LAST, slot.id
        LIMIT 1`,
      [algebra.id, today, weekday],
    );
  }

  // 3. The class's Algebra lessons: past ones with a lesson quiz, today's, this week's later ones.
  const lessons: AlgebraLesson[] = await manager.query(
    `SELECT lesson.id, lesson.date::text AS date, slot.period,
            (lesson.date + COALESCE(slot.starts_at, time '00:00')) AT TIME ZONE $3 AS "startsAt",
            (lesson.date + slot.ends_at) AT TIME ZONE $3 AS "endsAt",
            lesson.teacher_assignment_id AS "teacherAssignmentId", $4::int AS "teacherId"
       FROM lessons lesson
       LEFT JOIN timetable_slots slot ON slot.id = lesson.timetable_slot_id
      WHERE lesson.teacher_assignment_id = $1 AND lesson.date <= $2::date + 6 - ($5::int - 1)
        AND (lesson.date >= $2::date - ($5::int - 1)
             OR EXISTS (SELECT 1 FROM homework WHERE lesson_id = lesson.id AND quiz_id IS NOT NULL))
      ORDER BY lesson.date, slot.period NULLS LAST, slot.starts_at NULLS LAST, lesson.id`,
    [algebra.id, today, timezone, algebra.teacher_id, weekday],
  );
  const todayLesson = lessons.find((l) => l.date === today);
  if (!todayLesson) return summary; // the class has no Algebra slot at all
  const past = lessons.filter((l) => l.date < today && l !== todayLesson);
  const later = lessons.filter(
    (l) =>
      (l.date > today || (l.date === today && l !== todayLesson)) &&
      l.date <= addDays(monday, 6),
  );

  // 4. Topics in book order: past lessons cover the mastered ones, today the next one.
  const k = Math.min(DEMO_MASTERED_TOPICS, topics.length - 1);
  const deadline = quizDeadlineTime();
  const assign = async (lesson: AlgebraLesson, topic: AlgebraTopic) => {
    await manager.query(`UPDATE lessons SET topic_id = $1 WHERE id = $2`, [
      topic.id,
      lesson.id,
    ]);
    return lessonQuiz(manager, {
      lessonId: lesson.id,
      classId: input.classId,
      topic,
      date: lesson.date,
      deadline,
      teacherId: lesson.teacherId,
    });
  };
  const pastQuizzes: {
    lesson: AlgebraLesson;
    quizId: number;
    topic: AlgebraTopic;
  }[] = [];
  for (const [i, lesson] of past.entries()) {
    const topic = topics[k ? Math.floor((i * k) / past.length) : 0];
    pastQuizzes.push({ lesson, quizId: await assign(lesson, topic), topic });
  }
  const current = topics[k];
  const todayQuizId = await assign(todayLesson, current);
  for (const [j, lesson] of later.entries()) {
    await assign(lesson, topics[(k + 1 + j) % topics.length]);
  }

  // 5. Today's lesson is over and its quiz is open until 22:00 (at least two more hours).
  const endedAt =
    todayLesson.endsAt && todayLesson.endsAt.getTime() <= now.getTime()
      ? todayLesson.endsAt
      : new Date(now.getTime() - 60_000);
  await manager.query(`UPDATE lessons SET ended_at = $1 WHERE id = $2`, [
    endedAt,
    todayLesson.id,
  ]);
  await manager.query(
    `UPDATE homework SET due_at = GREATEST(due_at, $1::timestamptz)
      WHERE lesson_id = $2 AND quiz_id = $3`,
    [new Date(now.getTime() + 2 * 3600_000), todayLesson.id, todayQuizId],
  );
  summary.todayLesson = {
    lessonId: todayLesson.id,
    quizId: todayQuizId,
    topic: current.title,
    period: todayLesson.period,
  };

  // 6. Fresh attempts on these quizzes; past ones submitted except at most one overdue.
  const allQuizIds = [todayQuizId, ...pastQuizzes.map((q) => q.quizId)];
  await manager.query(
    `DELETE FROM attempts WHERE student_id = $1 AND quiz_id = ANY($2)`,
    [input.studentId, allQuizIds],
  );
  const overdueIndex = pastQuizzes.length >= 3 ? pastQuizzes.length - 2 : -1;
  const lastIndexOfTopic = new Map<number, number>();
  pastQuizzes.forEach((q, i) => {
    if (i !== overdueIndex) lastIndexOfTopic.set(q.topic.id, i);
  });
  const lastScore = new Map<number, { score: number; at: Date }>();
  for (const [i, { lesson, quizId, topic }] of pastQuizzes.entries()) {
    if (i === overdueIndex) {
      await manager.query(
        `DELETE FROM grades WHERE student_id = $1 AND lesson_id = $2 AND kind = 'quiz'`,
        [input.studentId, lesson.id],
      );
      summary.overdue++;
      continue;
    }
    let score = SCORES[i % SCORES.length];
    if (lastIndexOfTopic.get(topic.id) === i) score = Math.max(score, 90);
    const finishedAt = await submitAttempt(manager, {
      quizId,
      topicId: topic.id,
      studentId: input.studentId,
      lessonDate: lesson.date,
      score,
      now,
    });
    await upsert(
      manager,
      "grades",
      { student_id: input.studentId, lesson_id: lesson.id, kind: "quiz" },
      {
        teacher_assignment_id: lesson.teacherAssignmentId,
        value: gradeFor(score),
        comment: null,
        created_at: finishedAt,
      },
    );
    lastScore.set(topic.id, { score, at: finishedAt });
    summary.submitted++;
  }

  // 7. The topics before today's are mastered: quiz score and a passed checkpoint.
  await manager.query(
    `DELETE FROM topic_mastery WHERE student_id = $1 AND topic_id = ANY($2)`,
    [input.studentId, topics.map((t) => t.id)],
  );
  await manager.query(
    `DELETE FROM checkpoint_attempts WHERE student_id = $1 AND topic_id = ANY($2)`,
    [input.studentId, topics.slice(0, k).map((t) => t.id)],
  );
  for (const topic of topics.slice(0, k)) {
    const last = lastScore.get(topic.id) ?? {
      score: 90,
      at: new Date(now.getTime() - 3 * 86400_000),
    };
    const passedAt = new Date(
      Math.min(last.at.getTime() + 3600_000, now.getTime() - 3600_000),
    );
    const [{ key_ideas }] = await manager.query(
      `SELECT key_ideas FROM topics WHERE id = $1`,
      [topic.id],
    );
    const ideas: string[] = key_ideas ?? [];
    await manager.query(
      `INSERT INTO checkpoint_attempts (student_id, topic_id, try_number, mode, prompt, transcript, result,
                                        matched_ideas, missing_ideas, wrong_statements, feedback, created_at, judged_at)
       VALUES ($1, $2, 1, 'text', $3, $4, 'passed', $5, '[]', '[]', $6, $7, $8)`,
      [
        input.studentId,
        topic.id,
        `"${topic.title}" mavzusida bir narsani tushunmadim. Menga tushuntirib bera olasanmi?`,
        ideas.join(" "),
        JSON.stringify(ideas),
        "Rahmat, tushuntirganing uchun! Endi tushundim.",
        new Date(passedAt.getTime() - 5 * 60_000),
        passedAt,
      ],
    );
    await manager.query(
      `INSERT INTO topic_mastery (student_id, topic_id, mastery, home_score, is_mastered, updated_at)
       VALUES ($1, $2, $3, $4, true, $5)`,
      [input.studentId, topic.id, last.score, last.score, passedAt],
    );
    summary.mastered.push(topic.title);
  }
  return summary;
}

/** Adds an Algebra slot to `weekday` after its last period when that day has none. */
async function ensureAlgebraSlot(
  manager: EntityManager,
  assignmentId: number,
  weekday: number,
): Promise<boolean> {
  const [existing] = await manager.query(
    `SELECT id FROM timetable_slots WHERE teacher_assignment_id = $1 AND weekday = $2 LIMIT 1`,
    [assignmentId, weekday],
  );
  if (existing) return false;
  const [template] = await manager.query(
    `SELECT room_id, term_id FROM timetable_slots WHERE teacher_assignment_id = $1 ORDER BY id DESC LIMIT 1`,
    [assignmentId],
  );
  const [{ last }] = await manager.query(
    `SELECT COALESCE(max(slot.period), 0)::int AS last
       FROM timetable_slots slot
       JOIN teacher_assignments assignment ON assignment.id = slot.teacher_assignment_id
      WHERE slot.weekday = $2
        AND assignment.class_id = (SELECT class_id FROM teacher_assignments WHERE id = $1)`,
    [assignmentId, weekday],
  );
  const period = Math.min(
    last + 1,
    Math.max(...Object.keys(DEMO_PERIODS).map(Number)),
  );
  const [startsAt, endsAt] = DEMO_PERIODS[period];
  await manager.query(
    `INSERT INTO timetable_slots (teacher_assignment_id, room_id, term_id, weekday, period, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      assignmentId,
      template?.room_id ?? null,
      template?.term_id ?? null,
      weekday,
      period,
      startsAt,
      endsAt,
    ],
  );
  return true;
}

/** A submitted attempt with QUESTIONS_PER_ATTEMPT answers, `score` percent of them right. */
async function submitAttempt(
  manager: EntityManager,
  input: {
    quizId: number;
    topicId: number;
    studentId: number;
    lessonDate: string;
    score: number;
    now: Date;
  },
): Promise<Date> {
  const pool: {
    id: number;
    type: string;
    options: string[] | null;
    correct_answer: string;
  }[] = await manager.query(
    `SELECT id, type, options, correct_answer FROM questions
      WHERE topic_id = $1 AND status = 'approved' AND variant_of_id IS NULL ORDER BY id`,
    [input.topicId],
  );
  const picked = pool
    .map((q) => ({ q, r: unit(`pick:${input.quizId}:${q.id}`) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, QUESTIONS_PER_ATTEMPT)
    .map((p) => p.q);
  const right = Math.round((input.score / 100) * picked.length);
  const [{ started }] = await manager.query(
    `SELECT LEAST(($1::date + time '18:30') AT TIME ZONE $2, $3::timestamptz - interval '40 minutes') AS started`,
    [input.lessonDate, appTimezone(), input.now],
  );
  const finished = new Date(new Date(started).getTime() + 14 * 60_000);
  const scorePercent = picked.length ? (right / picked.length) * 100 : 0;
  const [{ id: attemptId }] = await manager.query(
    `INSERT INTO attempts (quiz_id, student_id, mode, score_percent, started_at, finished_at)
     VALUES ($1, $2, 'home', $3, $4, $5) RETURNING id`,
    [input.quizId, input.studentId, scorePercent, started, finished],
  );
  // Which answers are wrong is stable per quiz: the ones with the lowest key.
  const wrong = new Set(
    picked
      .map((q) => ({ id: q.id, r: unit(`wrong:${input.quizId}:${q.id}`) }))
      .sort((a, b) => a.r - b.r)
      .slice(0, picked.length - right)
      .map((w) => w.id),
  );
  for (const q of picked) {
    const isWrong = wrong.has(q.id);
    const answer = !isWrong
      ? q.correct_answer
      : q.type === "multiple_choice" && q.options?.length
        ? (q.options.find((o) => o !== q.correct_answer) ?? q.correct_answer)
        : q.correct_answer.trim() === "0"
          ? "1"
          : "0";
    await manager.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, answer, is_correct, hints_used, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        attemptId,
        q.id,
        answer,
        !isWrong,
        unit(`hint:${input.quizId}:${q.id}`) < 0.2 ? 1 : 0,
        isWrong ? 0 : 1,
      ],
    );
  }
  return finished;
}
