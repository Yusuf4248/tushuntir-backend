import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { appTimezone } from "../../common/school-time";
import {
  NotificationDto,
  ReadAllDto,
  UnreadCountDto,
} from "./dto/notification.dto";
import { StudentScheduleService } from "./student-schedule.service";

/** Lock namespace for pg_advisory_xact_lock, so two syncs of one student never run together. */
const SYNC_LOCK = 72_001;

const COLUMNS = `id, type, title, body, data, read_at AS "readAt", created_at AS "createdAt"`;

/**
 * The student's notifications. Grade, homework-checked, homework-due-tomorrow and quiz-unlocked
 * notifications are created when the student reads them (no scheduler): each sync adds what is
 * missing, keyed by notifications.data. Checkpoint passed is created when it happens (notify).
 */
@Injectable()
export class StudentNotificationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schedule: StudentScheduleService,
  ) {}

  async list(
    user: AuthUser,
    query: { unreadOnly?: boolean; limit?: number },
  ): Promise<NotificationDto[]> {
    await this.sync(user);
    return this.dataSource.query(
      `SELECT ${COLUMNS} FROM notifications
        WHERE user_id = $1 AND ($2::boolean IS NOT TRUE OR read_at IS NULL)
        ORDER BY created_at DESC, id DESC LIMIT $3`,
      [user.id, query.unreadOnly ?? false, query.limit ?? 50],
    );
  }

  async unreadCount(user: AuthUser): Promise<UnreadCountDto> {
    await this.sync(user);
    const [{ count }] = await this.dataSource.query(
      `SELECT count(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [user.id],
    );
    return { count };
  }

  async markRead(id: number, user: AuthUser): Promise<NotificationDto> {
    const [[row]] = await this.dataSource.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, now())
        WHERE id = $1 AND user_id = $2 RETURNING ${COLUMNS}`,
      [id, user.id],
    );
    if (!row) throw new NotFoundException(`Notification ${id} not found`);
    return row;
  }

  async readAll(user: AuthUser): Promise<ReadAllDto> {
    const [, updated] = await this.dataSource.query(
      `UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`,
      [user.id],
    );
    return { updated };
  }

  /** A notification for an event the app sees as it happens (e.g. a passed checkpoint). */
  async notify(
    manager: EntityManager,
    userId: number,
    input: {
      type: string;
      title: string;
      body: string | null;
      data: Record<string, unknown>;
    },
  ): Promise<void> {
    await manager.query(
      `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
      [userId, input.type, input.title, input.body, JSON.stringify(input.data)],
    );
  }

  /** Adds the notifications the student does not have yet. */
  private async sync(user: AuthUser): Promise<void> {
    const studentClass = await this.schedule.classOf(user.id);
    const timezone = appTimezone();
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock($1, $2)`, [
        SYNC_LOCK,
        user.id,
      ]);
      // A grade from the last 7 days.
      await manager.query(
        `INSERT INTO notifications (user_id, type, title, body, data, created_at)
         SELECT $1, 'grade',
                'Yangi baho: ' || subject.name || COALESCE(' — ' || grade.value, ''),
                NULLIF(concat_ws('. ',
                  CASE grade.kind WHEN 'classwork' THEN 'Darsdagi ish' WHEN 'homework' THEN 'Uy vazifasi'
                                  WHEN 'quiz' THEN 'Test' WHEN 'exam' THEN 'Imtihon'
                                  WHEN 'term' THEN 'Chorak bahosi' ELSE grade.kind END,
                  grade.comment), ''),
                jsonb_build_object('gradeId', grade.id, 'subjectId', subject.id, 'lessonId', grade.lesson_id),
                LEAST(grade.created_at, now())
           FROM grades grade
           JOIN teacher_assignments assignment ON assignment.id = grade.teacher_assignment_id
           JOIN subjects subject ON subject.id = assignment.subject_id
          WHERE grade.student_id = $1 AND grade.created_at > now() - interval '7 days'
            AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = $1 AND n.type = 'grade'
                              AND n.data->>'gradeId' = grade.id::text)`,
        [user.id],
      );
      // Homework checked or returned (again after each new check).
      await manager.query(
        `INSERT INTO notifications (user_id, type, title, body, data, created_at)
         SELECT $1, 'homework_checked',
                CASE submission.status WHEN 'returned' THEN 'Uy vazifasi qaytarildi: '
                                       ELSE 'Uy vazifasi tekshirildi: ' END || homework.title,
                NULLIF(concat_ws('. ', 'Ball: ' || submission.score, submission.feedback), ''),
                jsonb_build_object('homeworkId', homework.id, 'submissionId', submission.id,
                                   'checkedAt', extract(epoch FROM submission.checked_at)::bigint),
                LEAST(submission.checked_at, now())
           FROM homework_submissions submission
           JOIN homework ON homework.id = submission.homework_id
          WHERE submission.student_id = $1 AND submission.status IN ('checked', 'returned')
            AND submission.checked_at > now() - interval '30 days'
            AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = $1 AND n.type = 'homework_checked'
                              AND n.data->>'submissionId' = submission.id::text
                              AND n.data->>'checkedAt' = extract(epoch FROM submission.checked_at)::bigint::text)`,
        [user.id],
      );
      if (!studentClass) return;
      // Written homework due tomorrow and not submitted yet.
      await manager.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         SELECT $1, 'homework_due', 'Ertaga topshirish kerak: ' || homework.title,
                subject.name || '. Muddat: ' || to_char(homework.due_at AT TIME ZONE $3, 'DD.MM HH24:MI'),
                jsonb_build_object('homeworkId', homework.id, 'lessonId', lesson.id)
           FROM homework
           JOIN lessons lesson ON lesson.id = homework.lesson_id
           JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
           JOIN subjects subject ON subject.id = assignment.subject_id
          WHERE assignment.class_id = $2 AND homework.quiz_id IS NULL
            AND (homework.due_at AT TIME ZONE $3)::date = (now() AT TIME ZONE $3)::date + 1
            AND NOT EXISTS (SELECT 1 FROM homework_submissions
                             WHERE homework_id = homework.id AND student_id = $1)
            AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = $1 AND n.type = 'homework_due'
                              AND n.data->>'homeworkId' = homework.id::text)`,
        [user.id, studentClass.id, timezone],
      );
      // A lesson quiz unlocked in the last 7 days, still open and not submitted.
      await manager.query(
        `INSERT INTO notifications (user_id, type, title, body, data, created_at)
         SELECT $1, 'quiz_unlocked', 'Test ochildi: ' || COALESCE(topic.title, quiz.title, 'dars testi'),
                CASE WHEN homework.due_at IS NOT NULL
                     THEN 'Muddat: ' || to_char(homework.due_at AT TIME ZONE $3, 'DD.MM HH24:MI') END,
                jsonb_build_object('quizId', quiz.id, 'lessonId', lesson.id, 'topicId', quiz.topic_id),
                item.unlocks_at
           FROM homework
           JOIN quizzes quiz ON quiz.id = homework.quiz_id
           JOIN lessons lesson ON lesson.id = homework.lesson_id
           JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
           LEFT JOIN timetable_slots slot ON slot.id = lesson.timetable_slot_id
           LEFT JOIN topics topic ON topic.id = quiz.topic_id
           CROSS JOIN LATERAL (SELECT COALESCE(lesson.ended_at,
                 (lesson.date + COALESCE(slot.ends_at, time '23:59')) AT TIME ZONE $3) AS unlocks_at) item
          WHERE assignment.class_id = $2
            AND item.unlocks_at <= now() AND item.unlocks_at > now() - interval '7 days'
            AND (homework.due_at IS NULL OR homework.due_at > now())
            AND NOT EXISTS (SELECT 1 FROM attempts WHERE quiz_id = quiz.id AND student_id = $1
                              AND finished_at IS NOT NULL)
            AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = $1 AND n.type = 'quiz_unlocked'
                              AND n.data->>'quizId' = quiz.id::text)`,
        [user.id, studentClass.id, timezone],
      );
    });
  }
}
