import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as path from "path";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { FileService, StoredFile } from "../../shared/file/file.service";
import {
  FileDto,
  HomeworkDetailDto,
  HomeworkItemDto,
  HomeworkStatus,
  MySubmissionDto,
} from "./dto/homework.dto";
import { StudentScheduleService } from "./student-schedule.service";

/** Files a student may attach to a submission: images and PDF (no SVG). */
export const SUBMISSION_FILE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
};
export const MAX_SUBMISSION_FILES = 3;
export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024;

interface HomeworkRow {
  id: number;
  title: string;
  description: string | null;
  subjectId: number;
  subjectName: string;
  teacherId: number | null;
  firstName: string | null;
  lastName: string | null;
  lessonId: number;
  lessonDate: string;
  dueAt: Date | null;
  status: HomeworkStatus;
  score: number | null;
  hasAttachments: boolean;
  submissionId: number | null;
}

/**
 * Written homework of the student's class (homework rows without a quiz; lesson quizzes are in
 * /me/quizzes) and the student's own submission.
 */
@Injectable()
export class StudentHomeworkService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schedule: StudentScheduleService,
    private readonly files: FileService,
  ) {}

  async list(
    user: AuthUser,
    status?: HomeworkStatus,
  ): Promise<HomeworkItemDto[]> {
    const rows = await this.rows(user, { status });
    return rows.map((row) => this.item(row));
  }

  async detail(homeworkId: number, user: AuthUser): Promise<HomeworkDetailDto> {
    const [row] = await this.rows(user, { homeworkId });
    if (!row) throw new NotFoundException(`Homework ${homeworkId} not found`);
    const [attachments, submission] = await Promise.all([
      this.filesOf("homework", row.id),
      row.submissionId ? this.submission(row.submissionId) : null,
    ]);
    return {
      ...this.item(row),
      description: row.description,
      teacher: row.teacherId
        ? {
            id: row.teacherId,
            firstName: row.firstName!,
            lastName: row.lastName!,
          }
        : null,
      attachments,
      submission,
    };
  }

  /**
   * Creates or updates the student's submission until the teacher checks it (a returned one can
   * be sent again). Sent text replaces the text; sent files replace the files, otherwise they
   * are kept. After the deadline the submission is marked late.
   */
  async submit(
    homeworkId: number,
    input: { text?: string; files: Express.Multer.File[] },
    user: AuthUser,
  ): Promise<HomeworkDetailDto> {
    const [row] = await this.rows(user, { homeworkId });
    if (!row) throw new NotFoundException(`Homework ${homeworkId} not found`);
    if (row.status === "checked") {
      throw new ConflictException("This homework has already been checked");
    }
    const text = input.text?.trim();
    if (input.files.length > MAX_SUBMISSION_FILES) {
      throw new BadRequestException(
        `At most ${MAX_SUBMISSION_FILES} files (field name: files)`,
      );
    }
    for (const file of input.files) this.assertFileType(file);
    if (!row.submissionId && !text && !input.files.length) {
      throw new BadRequestException("Send the answer text, files or both");
    }

    const stored: StoredFile[] = [];
    let removed: string[];
    try {
      for (const file of input.files) stored.push(await this.files.save(file));
      removed = await this.dataSource.transaction(async (manager) => {
        const late = row.dueAt !== null && Date.now() > row.dueAt.getTime();
        const [{ id }] = await manager.query(
          `INSERT INTO homework_submissions (homework_id, student_id, answer_text, status, submitted_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (homework_id, student_id) DO UPDATE
             SET answer_text = CASE WHEN $5 THEN EXCLUDED.answer_text ELSE homework_submissions.answer_text END,
                 status = EXCLUDED.status, submitted_at = now()
           RETURNING id`,
          [
            row.id,
            user.id,
            text ?? null,
            late ? "late" : "submitted",
            text !== undefined,
          ],
        );
        if (!stored.length) return [] as string[];
        // DELETE ... RETURNING comes back as [rows, affected count].
        const [old]: [{ media_id: number; url: string }[], number] =
          await manager.query(
            `DELETE FROM attachments WHERE entity_type = 'submission' AND entity_id = $1
           RETURNING media_file_id AS media_id,
                     (SELECT url FROM media_files WHERE id = media_file_id) AS url`,
            [id],
          );
        if (old.length) {
          await manager.query(`DELETE FROM media_files WHERE id = ANY($1)`, [
            old.map((o) => o.media_id),
          ]);
        }
        for (const file of stored) {
          const [{ id: mediaId }] = await manager.query(
            `INSERT INTO media_files (uploaded_by, url, mime_type, size_bytes, original_name)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              user.id,
              file.url,
              file.mimeType,
              file.sizeBytes,
              file.originalName,
            ],
          );
          await manager.query(
            `INSERT INTO attachments (media_file_id, entity_type, entity_id) VALUES ($1, 'submission', $2)`,
            [mediaId, id],
          );
        }
        return old.map((o) => o.url);
      });
    } catch (error) {
      // Nothing was committed: the new files are not referenced anywhere.
      for (const file of stored) await this.files.remove(file.url);
      throw error;
    }
    // The replaced files are deleted from disk only after the change is committed.
    for (const url of removed) await this.files.remove(url);
    return this.detail(homeworkId, user);
  }

  private assertFileType(file: Express.Multer.File): void {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!SUBMISSION_FILE_TYPES[file.mimetype]?.includes(extension)) {
      throw new BadRequestException(
        `File type not allowed (${file.mimetype}, ${extension || "no extension"}). Allowed: jpg, png, webp, gif, pdf`,
      );
    }
  }

  private item(row: HomeworkRow): HomeworkItemDto {
    return {
      id: row.id,
      title: row.title,
      subject: { id: row.subjectId, name: row.subjectName },
      lessonId: row.lessonId,
      lessonDate: row.lessonDate,
      dueAt: row.dueAt,
      status: row.status,
      score: row.score,
      hasAttachments: row.hasAttachments,
    };
  }

  private async rows(
    user: AuthUser,
    filter: { homeworkId?: number; status?: HomeworkStatus },
  ): Promise<HomeworkRow[]> {
    const studentClass = await this.schedule.classOf(user.id);
    if (!studentClass) return [];
    return this.dataSource.query(
      `SELECT * FROM (
         SELECT homework.id, homework.title, homework.description,
                subject.id AS "subjectId", subject.name AS "subjectName",
                teacher.id AS "teacherId", teacher.first_name AS "firstName", teacher.last_name AS "lastName",
                lesson.id AS "lessonId", lesson.date::text AS "lessonDate", homework.due_at AS "dueAt",
                CASE WHEN submission.id IS NULL
                       THEN CASE WHEN homework.due_at < now() THEN 'overdue' ELSE 'new' END
                     ELSE COALESCE(submission.status::text, 'submitted') END AS status,
                CASE WHEN submission.status IN ('checked', 'returned') THEN submission.score END AS score,
                EXISTS (SELECT 1 FROM attachments
                         WHERE entity_type = 'homework' AND entity_id = homework.id) AS "hasAttachments",
                submission.id AS "submissionId"
           FROM homework
           JOIN lessons lesson ON lesson.id = homework.lesson_id
           JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
           JOIN subjects subject ON subject.id = assignment.subject_id
           LEFT JOIN users teacher ON teacher.id = COALESCE(homework.created_by, assignment.teacher_id)
           LEFT JOIN homework_submissions submission
                  ON submission.homework_id = homework.id AND submission.student_id = $2
          WHERE assignment.class_id = $1 AND homework.quiz_id IS NULL) item
        WHERE ($3::int IS NULL OR item.id = $3) AND ($4::text IS NULL OR item.status = $4)
        ORDER BY item."dueAt" DESC NULLS LAST, item.id DESC`,
      [
        studentClass.id,
        user.id,
        filter.homeworkId ?? null,
        filter.status ?? null,
      ],
    );
  }

  private async submission(id: number): Promise<MySubmissionDto> {
    const [row] = await this.dataSource.query(
      `SELECT id, answer_text AS text, COALESCE(status::text, 'submitted') AS status,
              CASE WHEN status IN ('checked', 'returned') THEN score END AS score,
              feedback, submitted_at AS "submittedAt", checked_at AS "checkedAt"
         FROM homework_submissions WHERE id = $1`,
      [id],
    );
    return { ...row, files: await this.filesOf("submission", id) };
  }

  private filesOf(entityType: string, entityId: number): Promise<FileDto[]> {
    return this.dataSource.query(
      `SELECT media.id, media.url, media.original_name AS "originalName", media.mime_type AS "mimeType",
              media.size_bytes::int AS "sizeBytes"
         FROM attachments attachment JOIN media_files media ON media.id = attachment.media_file_id
        WHERE attachment.entity_type = $1 AND attachment.entity_id = $2
        ORDER BY attachment.id`,
      [entityType, entityId],
    );
  }
}
