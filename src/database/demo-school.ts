/**
 * Demo school history for class 7-A, shared by seed:mvp and demo:reset:
 * past weeks of lessons with attendance and grades, four written homework items for the demo
 * student (new, submitted, checked, late) and a few older notifications.
 * Everything is derived from stable keys (dates, periods, the student's place in the class
 * list), so running it again changes nothing.
 */
import { promises as fs } from "fs";
import { EntityManager } from "typeorm";
import { addDays, appTimezone, localDate } from "../common/school-time";
import { storedFilePath } from "../shared/file/file.service";

export const DEMO_STUDENT_PHONE = "+998901001001";

/** School weeks (weeks with at least one term day) of history before the current week. */
const HISTORY_WEEKS = 6;
/** Target attendance of the demo student: (present + late) / (lessons - excused). */
const DEMO_ATTENDANCE = 0.92;

/** A stable number in [0, 1) for a key (FNV-1a). */
function unit(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

interface Slot {
  id: number;
  weekday: number;
  period: number;
  assignmentId: number;
  subjectCode: string | null;
}

interface PastLesson {
  id: number;
  date: string;
  period: number;
  subjectCode: string | null;
}

export interface HistorySummary {
  weeks: string[];
  lessons: number;
  attendanceRows: number;
  gradesAdded: number;
  demoAttendancePercent: number | null;
}

/** Lessons, attendance and grades for the school weeks before `monday`. */
export async function seedSchoolHistory(
  manager: EntityManager,
  input: { classId: number; monday: string },
): Promise<HistorySummary> {
  const timezone = appTimezone();
  const students: { id: number }[] = await manager.query(
    `SELECT enrolment.student_id AS id FROM class_students enrolment
       JOIN users student ON student.id = enrolment.student_id
      WHERE enrolment.class_id = $1 ORDER BY student.phone, student.id`,
    [input.classId],
  );
  const slots: Slot[] = await manager.query(
    `SELECT DISTINCT ON (slot.weekday, slot.period)
            slot.id, slot.weekday, slot.period, slot.teacher_assignment_id AS "assignmentId",
            subject.code AS "subjectCode"
       FROM timetable_slots slot
       JOIN teacher_assignments assignment ON assignment.id = slot.teacher_assignment_id
       JOIN subjects subject ON subject.id = assignment.subject_id
      -- School days only: a Sunday slot added for the demo (demo-progress) is not history.
      WHERE assignment.class_id = $1 AND slot.weekday <= 6
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

  // Walk back week by week, skipping weeks without term days (school breaks).
  const weeks: string[] = [];
  for (let back = 1; weeks.length < HISTORY_WEEKS && back <= 20; back++) {
    const weekMonday = addDays(input.monday, -7 * back);
    if ([0, 1, 2, 3, 4, 5].some((d) => inTerm(addDays(weekMonday, d)))) {
      weeks.push(weekMonday);
    }
  }
  const lessons: PastLesson[] = [];
  for (const weekMonday of [...weeks].reverse()) {
    for (const slot of slots) {
      const date = addDays(weekMonday, slot.weekday - 1);
      if (!inTerm(date)) continue;
      const [existing] = await manager.query(
        `SELECT id FROM lessons WHERE teacher_assignment_id = $1 AND timetable_slot_id = $2 AND date = $3`,
        [slot.assignmentId, slot.id, date],
      );
      const id: number =
        existing?.id ??
        (
          await manager.query(
            `INSERT INTO lessons (teacher_assignment_id, timetable_slot_id, date) VALUES ($1, $2, $3) RETURNING id`,
            [slot.assignmentId, slot.id, date],
          )
        )[0].id;
      lessons.push({
        id,
        date,
        period: slot.period,
        subjectCode: slot.subjectCode,
      });
    }
  }
  if (!lessons.length) {
    return {
      weeks,
      lessons: 0,
      attendanceRows: 0,
      gradesAdded: 0,
      demoAttendancePercent: null,
    };
  }
  // Past lessons are over: ended at their slot's end time.
  await manager.query(
    `UPDATE lessons lesson SET ended_at = (lesson.date + slot.ends_at) AT TIME ZONE $2
       FROM timetable_slots slot
      WHERE slot.id = lesson.timetable_slot_id AND lesson.id = ANY($1)
        AND lesson.ended_at IS NULL AND slot.ends_at IS NOT NULL`,
    [lessons.map((l) => l.id), timezone],
  );

  const demoPlan = demoAttendancePlan(lessons);
  let attendanceRows = 0;
  let gradesAdded = 0;
  for (const lesson of lessons) {
    const statuses = students.map((student, index) =>
      index === 0
        ? (demoPlan.get(lesson.id) ?? { status: "present", note: null })
        : classmateAttendance(lesson, index),
    );
    await manager.query(
      `INSERT INTO attendance (lesson_id, student_id, status, note)
       SELECT $1, student_id, status::attendance_status, note
         FROM unnest($2::int[], $3::text[], $4::text[]) AS t(student_id, status, note)
       ON CONFLICT (lesson_id, student_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note`,
      [
        lesson.id,
        students.map((s) => s.id),
        statuses.map((s) => s.status),
        statuses.map((s) => s.note),
      ],
    );
    attendanceRows += students.length;

    const grades = students
      .map((student, index) => ({
        studentId: student.id,
        grade: gradeFor(lesson, index, statuses[index].status),
      }))
      .filter((g) => g.grade !== null);
    if (grades.length) {
      // INSERT ... RETURNING comes back as the rows.
      const added: unknown[] = await manager.query(
        `WITH incoming AS (
           SELECT * FROM unnest($2::int[], $3::text[], $4::int[], $5::text[]) AS t(student_id, kind, value, comment))
         INSERT INTO grades (student_id, teacher_assignment_id, lesson_id, kind, value, comment, created_at)
         SELECT incoming.student_id, lesson.teacher_assignment_id, lesson.id, incoming.kind, incoming.value,
                incoming.comment, COALESCE(lesson.ended_at, lesson.date::timestamptz)
           FROM incoming JOIN lessons lesson ON lesson.id = $1
          WHERE NOT EXISTS (SELECT 1 FROM grades WHERE student_id = incoming.student_id AND lesson_id = $1)
         RETURNING id`,
        [
          lesson.id,
          grades.map((g) => g.studentId),
          grades.map((g) => g.grade!.kind),
          grades.map((g) => g.grade!.value),
          grades.map((g) => g.grade!.comment),
        ],
      );
      gradesAdded += added.length;
    }
  }
  const counted =
    lessons.length -
    [...demoPlan.values()].filter((p) => p.status === "excused").length;
  const missed = [...demoPlan.values()].filter(
    (p) => p.status === "absent",
  ).length;
  return {
    weeks,
    lessons: lessons.length,
    attendanceRows,
    gradesAdded,
    demoAttendancePercent: counted
      ? Math.round(((counted - missed) / counted) * 10000) / 100
      : null,
  };
}

/**
 * The demo student's absences, placed by position in the lesson list: two sick days (whole
 * days), single absences up to the target, three late arrivals, two excused (olympiad).
 */
function demoAttendancePlan(
  lessons: PastLesson[],
): Map<number, { status: string; note: string | null }> {
  const plan = new Map<number, { status: string; note: string | null }>();
  const excused = [
    Math.floor(lessons.length * 0.55),
    Math.floor(lessons.length * 0.55) + 1,
  ];
  for (const i of excused) {
    if (lessons[i])
      plan.set(lessons[i].id, {
        status: "excused",
        note: "Fan olimpiadasida qatnashdi",
      });
  }
  const counted = lessons.length - plan.size;
  const absentTarget = Math.round(counted * (1 - DEMO_ATTENDANCE));
  const dates = [...new Set(lessons.map((l) => l.date))];
  const sickDays = [
    dates[Math.floor(dates.length * 0.2)],
    dates[Math.floor(dates.length * 0.7)],
  ];
  let absent = 0;
  for (const lesson of lessons) {
    if (
      absent < absentTarget &&
      sickDays.includes(lesson.date) &&
      !plan.has(lesson.id)
    ) {
      plan.set(lesson.id, { status: "absent", note: "Kasal" });
      absent++;
    }
  }
  for (let i = 3; absent < absentTarget && i < lessons.length; i += 17) {
    if (!plan.has(lessons[i].id)) {
      plan.set(lessons[i].id, { status: "absent", note: null });
      absent++;
    }
  }
  let late = 0;
  for (let i = 8; late < 3 && i < lessons.length; i += 23) {
    if (!plan.has(lessons[i].id)) {
      plan.set(lessons[i].id, { status: "late", note: "10 daqiqa kechikdi" });
      late++;
    }
  }
  return plan;
}

/** Classmates: about 95% present, a few late, absent or excused. */
function classmateAttendance(
  lesson: PastLesson,
  index: number,
): { status: string; note: string | null } {
  // A whole sick day now and then, the same for every lesson of that day.
  if (unit(`sick:${lesson.date}:${index}`) < 0.03)
    return { status: "absent", note: "Kasal" };
  const r = unit(`att:${lesson.date}:${lesson.period}:${index}`);
  if (r < 0.015) return { status: "absent", note: null };
  if (r < 0.035) return { status: "late", note: null };
  if (r < 0.045)
    return { status: "excused", note: "Ota-onasining arizasi bilan" };
  return { status: "present", note: null };
}

const COMMENTS: Record<number, string[]> = {
  5: ["A'lo javob berdi", "Faol qatnashdi", "Mustaqil yechdi"],
  4: ["Yaxshi, kichik xatolar bor", "Daftarini tartibli yuritadi"],
  3: ["Mavzuni takrorlash kerak", "Uy vazifasini to'liq bajarmagan"],
};

/** About one grade in four lessons per student; the student's level sets the usual value. */
function gradeFor(
  lesson: PastLesson,
  index: number,
  attendance: string,
): { kind: string; value: number; comment: string | null } | null {
  if (attendance === "absent" || attendance === "excused") return null;
  if (unit(`grade:${lesson.date}:${lesson.period}:${index}`) >= 0.25)
    return null;
  // Level 3.6 to 4.8; the demo student (index 0) is a good student a bit weaker in algebra.
  const level =
    index === 0
      ? lesson.subjectCode === "ALGEBRA"
        ? 4.1
        : 4.6
      : 3.6 + unit(`level:${index}`) * 1.2;
  const value = Math.max(
    2,
    Math.min(
      5,
      Math.round(
        level +
          (unit(`value:${lesson.date}:${lesson.period}:${index}`) - 0.5) * 1.6,
      ),
    ),
  );
  const k = unit(`kind:${lesson.date}:${lesson.period}:${index}`);
  const kind = k < 0.65 ? "classwork" : k < 0.88 ? "homework" : "quiz";
  const comments = COMMENTS[value];
  const comment =
    comments && unit(`comment:${lesson.date}:${lesson.period}:${index}`) < 0.35
      ? comments[
          Math.floor(unit(`which:${lesson.date}:${index}`) * comments.length)
        ]
      : null;
  return { kind, value, comment };
}

interface DemoHomework {
  subjectCode: string;
  title: string;
  description: string;
  /** The homework belongs to the latest lesson of the subject on or before today - this. */
  lessonDaysAgo: number;
  /** Due at 18:00 school time, this many days from today (negative: past). */
  dueInDays: number;
  submission: null | {
    status: "submitted" | "checked" | "late";
    text: string;
    submittedDaysAgo: number;
    checkedDaysAgo?: number;
    score?: number;
    feedback?: string;
  };
}

export const DEMO_HOMEWORK: DemoHomework[] = [
  {
    subjectCode: "UZLANG",
    title: "Insho: Mening sevimli faslim",
    description:
      "10-12 gapdan iborat insho yozing. Kamida uchta sifatdosh ishlating.",
    lessonDaysAgo: 0,
    dueInDays: 1,
    submission: null,
  },
  {
    subjectCode: "ENG",
    title: "Workbook: 34-35 betlar",
    description: "Exercises 1-4 on pages 34-35 (Present Perfect).",
    lessonDaysAgo: 1,
    dueInDays: 2,
    submission: {
      status: "submitted",
      text: "1) have visited 2) has never seen 3) have you finished 4) hasn't arrived",
      submittedDaysAgo: 1,
    },
  },
  {
    subjectCode: "PHYS",
    title: "Masalalar: 12-15",
    description:
      "Darslikdagi 12-15 masalalarni yeching, birliklarni yozishni unutmang.",
    lessonDaysAgo: 5,
    dueInDays: -3,
    submission: {
      status: "checked",
      text: "12) v = s/t = 120/20 = 6 m/s; 13) ...; 14) ...; 15) ...",
      submittedDaysAgo: 4,
      checkedDaysAgo: 2,
      score: 85,
      feedback: "Yaxshi! 14-masalada birlikni yozmagansiz (m/s).",
    },
  },
  {
    subjectCode: "HIST",
    title: "3-paragraf savollari",
    description: "3-paragraf oxiridagi 1-5 savollarga yozma javob bering.",
    lessonDaysAgo: 6,
    dueInDays: -5,
    submission: {
      status: "late",
      text: "1) Amir Temur 1336-yilda tug'ilgan. 2) ...",
      submittedDaysAgo: 3,
    },
  },
];

/** At 18:00 school time, `days` from today. */
function dueAt(days: number, now: Date): string {
  return `${addDays(localDate(now), days)} 18:00`;
}

/**
 * The four written homework items of the demo student, put back to their demo state: the
 * homework rows (found by title and subject teacher) get fresh dates relative to today, and the
 * student's submissions are rewritten (the "new" one has none). Returns the files of removed
 * submissions so the caller can delete them after the commit.
 */
export async function seedDemoHomework(
  manager: EntityManager,
  input: { classId: number; studentId: number; now?: Date },
): Promise<{
  items: { title: string; status: string }[];
  removedFiles: string[];
}> {
  const timezone = appTimezone();
  const now = input.now ?? new Date();
  const today = localDate(now);
  const items: { title: string; status: string }[] = [];
  const removedFiles: string[] = [];
  for (const item of DEMO_HOMEWORK) {
    const [lesson]: {
      id: number;
      assignment_id: number;
      teacher_id: number;
    }[] = await manager.query(
      `SELECT lesson.id, assignment.id AS assignment_id, assignment.teacher_id
           FROM lessons lesson
           JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
           JOIN subjects subject ON subject.id = assignment.subject_id
          WHERE assignment.class_id = $1 AND subject.code = $2 AND lesson.date <= $3
          ORDER BY lesson.date DESC, lesson.id DESC LIMIT 1`,
      [input.classId, item.subjectCode, addDays(today, -item.lessonDaysAgo)],
    );
    if (!lesson) continue;
    const [existing] = await manager.query(
      `SELECT homework.id FROM homework
         JOIN lessons lesson ON lesson.id = homework.lesson_id
        WHERE homework.title = $1 AND lesson.teacher_assignment_id = $2 AND homework.quiz_id IS NULL
        ORDER BY homework.id LIMIT 1`,
      [item.title, lesson.assignment_id],
    );
    // $1 / $2: the local due time and the school time zone.
    const due = "($1::timestamp AT TIME ZONE $2)";
    let homeworkId: number;
    if (existing) {
      homeworkId = existing.id;
      await manager.query(
        `UPDATE homework SET lesson_id = $3, description = $4, created_by = $5, due_at = ${due} WHERE id = $6`,
        [
          dueAt(item.dueInDays, now),
          timezone,
          lesson.id,
          item.description,
          lesson.teacher_id,
          homeworkId,
        ],
      );
    } else {
      [{ id: homeworkId }] = await manager.query(
        `INSERT INTO homework (lesson_id, title, description, created_by, due_at)
         VALUES ($3, $4, $5, $6, ${due}) RETURNING id`,
        [
          dueAt(item.dueInDays, now),
          timezone,
          lesson.id,
          item.title,
          item.description,
          lesson.teacher_id,
        ],
      );
    }
    removedFiles.push(
      ...(await removeSubmissionFiles(manager, homeworkId, input.studentId)),
    );
    const s = item.submission;
    if (!s) {
      await manager.query(
        `DELETE FROM homework_submissions WHERE homework_id = $1 AND student_id = $2`,
        [homeworkId, input.studentId],
      );
      items.push({ title: item.title, status: "new" });
      continue;
    }
    await manager.query(
      `INSERT INTO homework_submissions (homework_id, student_id, answer_text, status, submitted_at,
                                         score, feedback, checked_at, checked_by)
       VALUES ($1, $2, $3, $4::submission_status, $10::timestamptz - make_interval(days => $5),
               $6, $7, CASE WHEN $8::int IS NULL THEN NULL ELSE $10::timestamptz - make_interval(days => $8::int) END,
               CASE WHEN $8::int IS NULL THEN NULL ELSE $9::int END)
       ON CONFLICT (homework_id, student_id) DO UPDATE
         SET answer_text = EXCLUDED.answer_text, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at,
             score = EXCLUDED.score, feedback = EXCLUDED.feedback, checked_at = EXCLUDED.checked_at,
             checked_by = EXCLUDED.checked_by`,
      [
        homeworkId,
        input.studentId,
        s.text,
        s.status,
        s.submittedDaysAgo,
        s.score ?? null,
        s.feedback ?? null,
        s.checkedDaysAgo ?? null,
        lesson.teacher_id,
        now,
      ],
    );
    items.push({ title: item.title, status: s.status });
  }
  return { items, removedFiles };
}

/** Deletes the attachments and media rows of a student's submission; returns their file URLs. */
export async function removeSubmissionFiles(
  manager: EntityManager,
  homeworkId: number,
  studentId: number,
): Promise<string[]> {
  const [rows]: [{ media_id: number; url: string }[], number] =
    await manager.query(
      `DELETE FROM attachments attachment
      USING homework_submissions submission
      WHERE attachment.entity_type = 'submission' AND attachment.entity_id = submission.id
        AND submission.homework_id = $1 AND submission.student_id = $2
      RETURNING attachment.media_file_id AS media_id,
                (SELECT url FROM media_files WHERE id = attachment.media_file_id) AS url`,
      [homeworkId, studentId],
    );
  if (!rows.length) return [];
  await manager.query(`DELETE FROM media_files WHERE id = ANY($1)`, [
    rows.map((r) => r.media_id),
  ]);
  return rows.map((r) => r.url).filter(Boolean);
}

/** Removes stored files (public or private) from disk, after the commit. */
export async function deleteUploadedFiles(urls: string[]): Promise<void> {
  for (const url of urls) {
    const filePath = storedFilePath(url);
    if (filePath) await fs.rm(filePath, { force: true });
  }
}

/** Two older, already read notifications; the app adds the fresh ones when they are read. */
export async function seedDemoNotifications(
  manager: EntityManager,
  input: { studentId: number; firstName: string },
): Promise<void> {
  const notes = [
    {
      seed: "welcome",
      type: "flag",
      title: "Xush kelibsiz!",
      body: `${input.firstName}, bu yerda darslar, testlar, uy vazifalari va baholaringiz bor.`,
      daysAgo: 40,
    },
    {
      seed: "weekly",
      type: "weekly_progress",
      title: "O'tgan hafta natijalari",
      body: "Davomat 95%. Algebrada yana mashq qilish foydali bo'ladi.",
      daysAgo: 8,
    },
  ];
  for (const note of notes) {
    await manager.query(
      `INSERT INTO notifications (user_id, type, title, body, data, read_at, created_at)
       SELECT $1, $2, $3, $4, jsonb_build_object('seed', $5::text),
              ($6::date + time '18:00') AT TIME ZONE $7, ($6::date + time '17:00') AT TIME ZONE $7
        WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = $1 AND data->>'seed' = $5)`,
      [
        input.studentId,
        note.type,
        note.title,
        note.body,
        note.seed,
        addDays(localDate(), -note.daysAgo),
        appTimezone(),
      ],
    );
  }
}
