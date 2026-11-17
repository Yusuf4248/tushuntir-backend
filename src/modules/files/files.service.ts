import { Injectable, NotFoundException } from "@nestjs/common";
import { createReadStream, promises as fs } from "fs";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { UserRole } from "../../common/enums";
import { storedFilePath } from "../../shared/file/file.service";

export interface PrivateFile {
  stream: NodeJS.ReadableStream;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
}

interface FileRow {
  url: string;
  mime_type: string | null;
  original_name: string | null;
  student_id: number;
  class_id: number;
  school_id: number;
}

/** Private files (homework submissions) and who may read them. */
@Injectable()
export class FilesService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * The file for a logged-in user: the student who submitted it, a teacher of that class, an
   * admin of that school or a super admin. Everyone else gets 404 (the file is not revealed).
   */
  async forUser(mediaFileId: number, user: AuthUser): Promise<PrivateFile> {
    const row = await this.row(mediaFileId);
    if (!row || !(await this.mayRead(row, user))) this.notFound(mediaFileId);
    return this.open(row!, mediaFileId);
  }

  /** The file for a valid signed link (checked by the caller). */
  async forSignedLink(mediaFileId: number): Promise<PrivateFile> {
    const row = await this.row(mediaFileId);
    if (!row) this.notFound(mediaFileId);
    return this.open(row!, mediaFileId);
  }

  private async mayRead(row: FileRow, user: AuthUser): Promise<boolean> {
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return true;
      case UserRole.ADMIN:
        return user.schoolId === row.school_id;
      case UserRole.STUDENT:
        return user.id === row.student_id;
      case UserRole.TEACHER: {
        const [assigned] = await this.dataSource.query(
          `SELECT 1 FROM teacher_assignments WHERE class_id = $1 AND teacher_id = $2 LIMIT 1`,
          [row.class_id, user.id],
        );
        return Boolean(assigned);
      }
      default:
        return false;
    }
  }

  private async row(mediaFileId: number): Promise<FileRow | undefined> {
    const [row] = await this.dataSource.query(
      `SELECT media.url, media.mime_type, media.original_name, submission.student_id,
              assignment.class_id, class.school_id
         FROM media_files media
         JOIN attachments attachment ON attachment.media_file_id = media.id
                                    AND attachment.entity_type = 'submission'
         JOIN homework_submissions submission ON submission.id = attachment.entity_id
         JOIN homework ON homework.id = submission.homework_id
         JOIN lessons lesson ON lesson.id = homework.lesson_id
         JOIN teacher_assignments assignment ON assignment.id = lesson.teacher_assignment_id
         JOIN classes class ON class.id = assignment.class_id
        WHERE media.id = $1
        LIMIT 1`,
      [mediaFileId],
    );
    return row;
  }

  private async open(row: FileRow, mediaFileId: number): Promise<PrivateFile> {
    const filePath = storedFilePath(row.url);
    const stat = filePath ? await fs.stat(filePath).catch(() => null) : null;
    if (!filePath || !stat?.isFile()) this.notFound(mediaFileId);
    return {
      stream: createReadStream(filePath!),
      mimeType: row.mime_type ?? "application/octet-stream",
      fileName: row.original_name ?? `file-${mediaFileId}`,
      sizeBytes: stat!.size,
    };
  }

  private notFound(mediaFileId: number): never {
    throw new NotFoundException(`File ${mediaFileId} not found`);
  }
}
