import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import {
  addDays,
  appTimezone,
  isoWeekday,
  localDate,
} from "../../common/school-time";
import {
  AttendanceDto,
  AttendanceRecordDto,
  AttendanceStatus,
  TimetableDto,
  TimetableLessonDto,
} from "./dto/school.dto";
import { LessonStatus } from "./me.types";
import { StudentScheduleService } from "./student-schedule.service";

/** School days shown in the timetable: Monday (1) to Saturday (6). */
const SCHOOL_DAYS = 6;

interface TimetableRow {
  lessonId: number | null;
  date: string;
  period: number | null;
  startsAt: string | null;
  endsAt: string | null;
  startAt: Date;
  endAt: Date;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  firstName: string;
  lastName: string;
  room: string | null;
  topicId: number | null;
  topicTitle: string | null;
  hasQuiz: boolean;
  hasHomework: boolean;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Read-only school views for the student: timetable, attendance, grades. */
@Injectable()
export class StudentSchoolService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schedule: StudentScheduleService,
  ) {}

  /**
   * The class timetable of one week. Lessons come from the lessons table; a timetable slot
   * without a lesson record that day (e.g. a future week) is shown with lessonId null, but only
   * on days inside a term (no slots during the school break).
   */
  async timetable(user: AuthUser, weekStart?: string): Promise<TimetableDto> {
    const timezone = appTimezone();
    const anyDay = weekStart ?? localDate();
    const monday = addDays(anyDay, 1 - isoWeekday(anyDay));
    const saturday = addDays(monday, SCHOOL_DAYS - 1);
    const studentClass = await this.schedule.classOf(user.id);
    const days = Array.from({ length: SCHOOL_DAYS }, (_, i) => ({
      date: addDays(monday, i),
      weekday: i + 1,
      lessons: [] as TimetableLessonDto[],
    }));
    if (!studentClass) {
      return {
        weekStart: monday,
        weekEnd: saturday,
        timezone,
        class: null,
        days,
      };
    }
    const rows: TimetableRow[] = await this.dataSource.query(
      `WITH week AS (
         SELECT d::date AS date FROM generate_series($2::date, $3::date, interval '1 day') d),
       planned AS (
         -- recorded lessons
         SELECT lesson.id AS lesson_id, lesson.date, lesson.teacher_assignment_id, lesson.timetable_slot_id,
                lesson.topic_id, lesson.ended_at
           FROM lessons lesson
           JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
          WHERE assignment.class_id = $1 AND lesson.date BETWEEN $2 AND $3
         UNION ALL
         -- timetable slots with no lesson record that day, on term days only
         SELECT NULL, week.date, slot.teacher_assignment_id, slot.id, NULL, NULL
           FROM week
           JOIN timetable_slots slot ON slot.weekday = EXTRACT(ISODOW FROM week.date)
           JOIN teacher_assignments assignment ON assignment.id = slot.teacher_assignment_id
          WHERE assignment.class_id = $1
            AND EXISTS (SELECT 1 FROM terms term
                         WHERE week.date BETWEEN term.starts_on AND term.ends_on
                           AND (slot.term_id IS NULL OR term.id = slot.term_id
                                OR term.academic_year_id = (SELECT academic_year_id FROM terms WHERE id = slot.term_id)))
            AND NOT EXISTS (SELECT 1 FROM lessons lesson
                             WHERE lesson.timetable_slot_id = slot.id AND lesson.date = week.date))
       SELECT planned.lesson_id AS "lessonId", planned.date::text AS date, slot.period,
              to_char(slot.starts_at, 'HH24:MI') AS "startsAt", to_char(slot.ends_at, 'HH24:MI') AS "endsAt",
              (planned.date + COALESCE(slot.starts_at, time '00:00')) AT TIME ZONE $4 AS "startAt",
              COALESCE(planned.ended_at, (planned.date + COALESCE(slot.ends_at, time '23:59')) AT TIME ZONE $4) AS "endAt",
              subject.id AS "subjectId", subject.name AS "subjectName",
              teacher.id AS "teacherId", teacher.first_name AS "firstName", teacher.last_name AS "lastName",
              room.name AS room, topic.id AS "topicId", topic.title AS "topicTitle",
              EXISTS (SELECT 1 FROM homework WHERE lesson_id = planned.lesson_id AND quiz_id IS NOT NULL) AS "hasQuiz",
              EXISTS (SELECT 1 FROM homework WHERE lesson_id = planned.lesson_id AND quiz_id IS NULL) AS "hasHomework"
         FROM planned
         JOIN teacher_assignments assignment ON assignment.id = planned.teacher_assignment_id
         JOIN subjects subject ON subject.id = assignment.subject_id
         JOIN users teacher ON teacher.id = assignment.teacher_id
         LEFT JOIN timetable_slots slot ON slot.id = planned.timetable_slot_id
         LEFT JOIN rooms room ON room.id = slot.room_id
         LEFT JOIN topics topic ON topic.id = planned.topic_id
        ORDER BY planned.date, slot.period NULLS LAST, slot.starts_at NULLS LAST, planned.lesson_id`,
      [studentClass.id, monday, saturday, timezone],
    );
    const now = new Date();
    for (const row of rows) {
      const day = days.find((d) => d.date === row.date);
      day?.lessons.push({
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
        teacher: {
          id: row.teacherId,
          firstName: row.firstName,
          lastName: row.lastName,
        },
        room: row.room,
        topic: row.topicId ? { id: row.topicId, title: row.topicTitle! } : null,
        hasQuiz: row.hasQuiz,
        hasHomework: row.hasHomework,
      });
    }
    return {
      weekStart: monday,
      weekEnd: saturday,
      timezone,
      class: {
        id: studentClass.id,
        name: `${studentClass.grade}-${studentClass.letter}`,
      },
      days,
    };
  }

  /** The student's attendance records of one month, with counts and the attendance percent. */
  async attendance(user: AuthUser, month?: string): Promise<AttendanceDto> {
    const value = month ?? localDate().slice(0, 7);
    const rows: (Omit<AttendanceRecordDto, "subject"> & {
      subjectId: number;
      subjectName: string;
    })[] = await this.dataSource.query(
      `SELECT lesson.date::text AS date, slot.period, subject.id AS "subjectId", subject.name AS "subjectName",
              lesson.id AS "lessonId", record.status, record.note
         FROM attendance record
         JOIN lessons lesson ON lesson.id = record.lesson_id
         JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
         JOIN subjects subject ON subject.id = assignment.subject_id
         LEFT JOIN timetable_slots slot ON slot.id = lesson.timetable_slot_id
        WHERE record.student_id = $1 AND to_char(lesson.date, 'YYYY-MM') = $2
        ORDER BY lesson.date, slot.period NULLS LAST, lesson.id`,
      [user.id, value],
    );
    const count = (status: AttendanceStatus) =>
      rows.filter((r) => r.status === status).length;
    const summary = {
      present: count(AttendanceStatus.PRESENT),
      absent: count(AttendanceStatus.ABSENT),
      late: count(AttendanceStatus.LATE),
      excused: count(AttendanceStatus.EXCUSED),
    };
    const counted = rows.length - summary.excused;
    return {
      month: value,
      records: rows.map(({ subjectId, subjectName, ...record }) => ({
        ...record,
        subject: { id: subjectId, name: subjectName },
      })),
      summary: {
        ...summary,
        percent: counted
          ? round2(((summary.present + summary.late) / counted) * 100)
          : null,
      },
    };
  }
}
