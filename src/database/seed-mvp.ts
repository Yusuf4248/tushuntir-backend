/**
 * npm run seed:mvp — demo data for the MVP student flow. Safe to run again: every row is
 * matched by a natural key (phone, name, class letter, slot, lesson date) and only updated.
 *
 * Needs: migrations applied, `npm run content:load` done, SEED_DEMO_PASSWORD set.
 * Creates: a school in Fergana, academic year 2026/2027 with its terms, class 7-A with
 * 25 students and their parents, five teachers, a weekly timetable (algebra five days a week),
 * this week's lessons (algebra lessons follow the textbook topics in order) and, for every
 * algebra lesson, a homework quiz that closes at QUIZ_DEADLINE_TIME on the lesson's day.
 * Then it generates AI questions for every algebra topic that has fewer than
 * MIN_QUESTIONS usable ones, and approves them when DEMO_MODE=true.
 */
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { EntityManager } from "typeorm";
import {
  addDays,
  appTimezone,
  isoWeekday,
  localDate,
  quizDeadlineTime,
} from "../common/school-time";
import { readAiConfig } from "../modules/ai/ai.config";
import { AiUnavailableException } from "../modules/ai/ai.errors";
import { createLlmService } from "../modules/ai/ai.module";
import { demoModeEnabled } from "../modules/demo/demo.service";
import { BCRYPT_ROUNDS } from "../modules/identity/users/users.service";
import { QuestionGenerationService } from "../modules/learning/question-generation/question-generation.service";
import dataSource from "./data-source";
import { upsert } from "./upsert";

const SCHOOL = {
  name: "21-maktab (demo)",
  region: "Farg'ona viloyati",
  district: "Marg'ilon shahri",
  type: "public",
};
const YEAR = {
  name: "2026/2027",
  starts_on: "2026-09-02",
  ends_on: "2027-05-31",
};
const TERMS = [
  { name: "1-chorak", starts_on: "2026-09-02", ends_on: "2026-11-01" },
  { name: "2-chorak", starts_on: "2026-11-09", ends_on: "2026-12-27" },
  { name: "3-chorak", starts_on: "2027-01-11", ends_on: "2027-03-20" },
  { name: "4-chorak", starts_on: "2027-03-30", ends_on: "2027-05-31" },
];

/** Subject code → teacher. ALGEBRA comes from content:load; the others only fill the timetable. */
const TEACHERS: Record<
  string,
  { subject: string; first: string; last: string; phone: string }
> = {
  ALGEBRA: {
    subject: "Algebra",
    first: "Dilnoza",
    last: "Karimova",
    phone: "+998901000001",
  },
  UZLANG: {
    subject: "Ona tili",
    first: "Gulnora",
    last: "Saidova",
    phone: "+998901000002",
  },
  ENG: {
    subject: "Ingliz tili",
    first: "Shahnoza",
    last: "Ahmedova",
    phone: "+998901000003",
  },
  PHYS: {
    subject: "Fizika",
    first: "Rustam",
    last: "Qosimov",
    phone: "+998901000004",
  },
  HIST: {
    subject: "Tarix",
    first: "Bahodir",
    last: "Ergashev",
    phone: "+998901000005",
  },
};

/** First shift: period → [starts, ends] */
const PERIODS: Record<number, [string, string]> = {
  1: ["08:00", "08:45"],
  2: ["08:55", "09:40"],
  3: ["09:50", "10:35"],
  4: ["10:45", "11:30"],
  5: ["11:40", "12:25"],
};

/** Weekday (1 = Monday) → subject codes by period. Algebra five days a week. */
const TIMETABLE: Record<number, string[]> = {
  1: ["UZLANG", "ALGEBRA", "ENG", "PHYS"],
  2: ["ALGEBRA", "UZLANG", "HIST", "ENG"],
  3: ["PHYS", "UZLANG", "ALGEBRA", "HIST"],
  4: ["ENG", "ALGEBRA", "UZLANG", "PHYS"],
  5: ["ALGEBRA", "UZLANG", "ENG", "HIST"],
  6: ["PHYS", "ENG", "UZLANG"],
};

/** [first name, family name (male form), gender] — female family names add "a". */
const STUDENTS: [string, string, "m" | "f"][] = [
  ["Aziz", "Rahimov", "m"],
  ["Madina", "Yusupov", "f"],
  ["Jasur", "Toshmatov", "m"],
  ["Nilufar", "Aliyev", "f"],
  ["Sardor", "Karimov", "m"],
  ["Sevara", "Usmonov", "f"],
  ["Bekzod", "Saidov", "m"],
  ["Gulnoza", "Raximov", "f"],
  ["Otabek", "Nazarov", "m"],
  ["Malika", "Tursunov", "f"],
  ["Shohruh", "Ergashev", "m"],
  ["Zarina", "Ismoilov", "f"],
  ["Javohir", "Qodirov", "m"],
  ["Shahzoda", "Ortiqov", "f"],
  ["Doniyor", "Mirzayev", "m"],
  ["Mohinur", "Xasanov", "f"],
  ["Ulug'bek", "Abdullayev", "m"],
  ["Dildora", "Jo'rayev", "f"],
  ["Islom", "Xolmatov", "m"],
  ["Kamola", "Rustamov", "f"],
  ["Behruz", "Sobirov", "m"],
  ["Feruza", "Normatov", "f"],
  ["Asadbek", "Fayzullayev", "m"],
  ["Munisa", "Hamidov", "f"],
  ["Temur", "Sharipov", "m"],
];
const MOTHERS = ["Gulnora", "Dilfuza", "Nodira", "Mavluda", "Zulfiya"];
const FATHERS = ["Akmal", "Rustam", "Sherzod", "Anvar", "Bahrom"];

/** A topic with at least this many draft or approved questions is not generated again. */
const MIN_QUESTIONS = 10;

const studentPhone = (i: number) =>
  `+9989010010${String(i + 1).padStart(2, "0")}`;
const parentPhone = (i: number) =>
  `+9989010020${String(i + 1).padStart(2, "0")}`;

interface SeedUser {
  role: string;
  schoolId: number;
  first: string;
  last: string;
  phone: string;
}

async function seedUser(
  manager: EntityManager,
  user: SeedUser,
  passwordHash: string,
): Promise<number> {
  const [existing] = await manager.query(
    `SELECT id, role FROM users WHERE phone = $1`,
    [user.phone],
  );
  if (existing && existing.role !== user.role) {
    throw new Error(
      `phone ${user.phone} already belongs to a ${existing.role} (user ${existing.id}); not changing it to ${user.role}`,
    );
  }
  return upsert(
    manager,
    "users",
    { phone: user.phone },
    {
      role: user.role,
      school_id: user.schoolId,
      first_name: user.first,
      last_name: user.last,
      is_active: true,
      password_hash: passwordHash,
    },
  );
}

async function requireTopics(
  manager: EntityManager,
): Promise<{ id: number; title: string }[]> {
  const topics: { id: number; title: string }[] = await manager.query(
    `SELECT topic.id, topic.title
       FROM topics topic
       JOIN chapters chapter ON chapter.id = topic.chapter_id
       JOIN textbooks textbook ON textbook.id = chapter.textbook_id
       JOIN subjects subject ON subject.id = textbook.subject_id
      WHERE subject.code = 'ALGEBRA' AND textbook.grade = 7
      ORDER BY chapter.number, topic.position`,
  );
  if (!topics.length) {
    throw new Error(
      "No Grade 7 algebra topics found; run npm run content:load first",
    );
  }
  return topics;
}

async function seed(manager: EntityManager, passwordHash: string) {
  const topics = await requireTopics(manager);
  const today = localDate();
  const monday = addDays(today, 1 - isoWeekday(today));

  const schoolId = await upsert(
    manager,
    "schools",
    { name: SCHOOL.name },
    SCHOOL,
  );
  const yearId = await upsert(
    manager,
    "academic_years",
    { school_id: schoolId, name: YEAR.name },
    { starts_on: YEAR.starts_on, ends_on: YEAR.ends_on, is_current: true },
  );
  const termIds: number[] = [];
  for (const term of TERMS) {
    termIds.push(
      await upsert(
        manager,
        "terms",
        { academic_year_id: yearId, name: term.name },
        { starts_on: term.starts_on, ends_on: term.ends_on },
      ),
    );
  }
  const currentTerm = TERMS.findIndex(
    (t) => t.starts_on <= today && today <= t.ends_on,
  );
  const termId = termIds[currentTerm >= 0 ? currentTerm : 1];
  const roomId = await upsert(
    manager,
    "rooms",
    { school_id: schoolId, name: "7-A xonasi" },
    { type: "classroom", seats: 30 },
  );

  const teacherIds: Record<string, number> = {};
  const subjectIds: Record<string, number> = {};
  for (const [code, teacher] of Object.entries(TEACHERS)) {
    subjectIds[code] = await upsert(
      manager,
      "subjects",
      { code },
      code === "ALGEBRA" ? {} : { name: teacher.subject },
    );
    teacherIds[code] = await seedUser(
      manager,
      {
        role: "teacher",
        schoolId,
        first: teacher.first,
        last: teacher.last,
        phone: teacher.phone,
      },
      passwordHash,
    );
  }

  const classId = await upsert(
    manager,
    "classes",
    { school_id: schoolId, academic_year_id: yearId, grade: 7, letter: "A" },
    { homeroom_teacher_id: teacherIds.ALGEBRA, shift: "first" },
  );

  for (const [i, [first, family, gender]] of STUDENTS.entries()) {
    const studentId = await seedUser(
      manager,
      {
        role: "student",
        schoolId,
        first,
        last: gender === "f" ? `${family}a` : family,
        phone: studentPhone(i),
      },
      passwordHash,
    );
    await upsert(
      manager,
      "class_students",
      { class_id: classId, student_id: studentId },
      { joined_on: YEAR.starts_on },
    );
    const mother = i % 2 === 0;
    const parentId = await seedUser(
      manager,
      {
        role: "parent",
        schoolId,
        first: (mother ? MOTHERS : FATHERS)[i % 5],
        last: mother ? `${family}a` : family,
        phone: parentPhone(i),
      },
      passwordHash,
    );
    await upsert(
      manager,
      "parent_students",
      { parent_id: parentId, student_id: studentId },
      { relation: mother ? "mother" : "father" },
    );
  }

  const assignmentIds: Record<string, number> = {};
  for (const code of Object.keys(TEACHERS)) {
    assignmentIds[code] = await upsert(
      manager,
      "teacher_assignments",
      {
        teacher_id: teacherIds[code],
        class_id: classId,
        subject_id: subjectIds[code],
      },
      {},
    );
  }

  const deadline = quizDeadlineTime();
  let algebraLesson = 0;
  const quizzes: { lessonId: number; quizId: number; topic: string }[] = [];
  for (const [weekday, codes] of Object.entries(TIMETABLE)) {
    const date = addDays(monday, Number(weekday) - 1);
    for (const [index, code] of codes.entries()) {
      const period = index + 1;
      const [startsAt, endsAt] = PERIODS[period];
      const slotId = await upsert(
        manager,
        "timetable_slots",
        {
          teacher_assignment_id: assignmentIds[code],
          term_id: termId,
          weekday: Number(weekday),
          period,
        },
        { room_id: roomId, starts_at: startsAt, ends_at: endsAt },
      );
      const topic =
        code === "ALGEBRA" ? topics[algebraLesson++ % topics.length] : null;
      const lessonId = await upsert(
        manager,
        "lessons",
        {
          teacher_assignment_id: assignmentIds[code],
          timetable_slot_id: slotId,
          date,
        },
        { topic_id: topic?.id ?? null },
      );
      if (topic) {
        const quizId = await seedLessonQuiz(manager, {
          lessonId,
          classId,
          topic,
          date,
          deadline,
          teacherId: teacherIds.ALGEBRA,
        });
        quizzes.push({ lessonId, quizId, topic: topic.title });
      }
    }
  }
  return { schoolId, classId, monday, quizzes, teacherIds, topics };
}

/** One homework quiz per algebra lesson, linked through the homework row (lesson → quiz → due_at). */
async function seedLessonQuiz(
  manager: EntityManager,
  input: {
    lessonId: number;
    classId: number;
    topic: { id: number; title: string };
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

/** AI questions for each topic; approved for students when DEMO_MODE=true. */
async function seedQuestions(
  topics: { id: number; title: string }[],
  teacherId: number,
): Promise<void> {
  const generation = new QuestionGenerationService(
    createLlmService(readAiConfig(new ConfigService())),
    dataSource,
  );
  const autoApprove = demoModeEnabled();
  console.log(
    `\nQuestions (${autoApprove ? "DEMO_MODE: auto-approved" : "drafts for teacher review"}):`,
  );
  for (const topic of topics) {
    const [{ usable }] = await dataSource.query(
      `SELECT count(*)::int AS usable FROM questions WHERE topic_id = $1 AND status IN ('draft', 'approved')`,
      [topic.id],
    );
    let line = `  topic ${topic.id} "${topic.title}": `;
    if (usable >= MIN_QUESTIONS) {
      line += `${usable} already, skipped generation`;
    } else {
      try {
        const result = await generation.generate(topic.id);
        line += `${result.generated} generated, ${result.saved} saved, ${result.dropped.length} dropped`;
      } catch (error) {
        if (!(error instanceof AiUnavailableException)) throw error;
        console.warn(
          `${line}skipped (${error.message}). Run npm run seed:mvp again once AI is configured.`,
        );
        continue;
      }
    }
    if (autoApprove) {
      const approved = await generation.approveAll(topic.id, teacherId);
      if (approved) line += `, ${approved} approved`;
    }
    console.log(line);
  }
}

async function main() {
  const password = process.env.SEED_DEMO_PASSWORD?.trim();
  if (!password || password.length < 8) {
    throw new Error("SEED_DEMO_PASSWORD must be set in .env (8+ characters)");
  }
  await dataSource.initialize();
  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await dataSource.transaction((manager) =>
      seed(manager, passwordHash),
    );
    console.log(
      `School ${result.schoolId}, class 7-A ${result.classId}: 25 students, 25 parents, 5 teachers`,
    );
    console.log(
      `Timetable and lessons for the week of ${result.monday}; ${result.quizzes.length} algebra lesson quizzes:`,
    );
    for (const quiz of result.quizzes) {
      console.log(
        `  lesson ${quiz.lessonId} → quiz ${quiz.quizId} (${quiz.topic})`,
      );
    }
    await seedQuestions(result.topics, result.teacherIds.ALGEBRA);
    console.log(
      "\nDemo logins (password: the SEED_DEMO_PASSWORD value in .env):",
    );
    console.log(
      `  student  ${studentPhone(0)}  (${STUDENTS[0][0]} ${STUDENTS[0][1]})`,
    );
    console.log(
      `  teacher  ${TEACHERS.ALGEBRA.phone}  (${TEACHERS.ALGEBRA.first} ${TEACHERS.ALGEBRA.last}, algebra)`,
    );
    console.log(
      `  parent   ${parentPhone(0)}  (${MOTHERS[0]} ${STUDENTS[0][1]}a, mother of ${STUDENTS[0][0]})`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`seed:mvp failed: ${error.message}`);
  process.exit(1);
});
