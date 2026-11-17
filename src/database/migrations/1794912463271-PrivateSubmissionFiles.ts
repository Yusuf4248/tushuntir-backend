import { promises as fs } from "fs";
import * as path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";
import { privateDir, uploadsDir } from "../../shared/file/file.service";

/**
 * Homework submission files become private: moved from <UPLOADS_DIR> (served publicly under
 * /uploads) to <UPLOADS_DIR>/private, and media_files.url from "/uploads/<name>" to
 * "private/<name>". Files missing on disk only get their url changed.
 */
export class PrivateSubmissionFiles1794912463271 implements MigrationInterface {
  name = "PrivateSubmissionFiles1794912463271";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.move(
      queryRunner,
      "/uploads/",
      uploadsDir(),
      "private/",
      privateDir(),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.move(
      queryRunner,
      "private/",
      privateDir(),
      "/uploads/",
      uploadsDir(),
    );
  }

  private async move(
    queryRunner: QueryRunner,
    fromPrefix: string,
    fromDir: string,
    toPrefix: string,
    toDir: string,
  ): Promise<void> {
    const rows: { id: number; url: string }[] = await queryRunner.query(
      `SELECT DISTINCT media.id, media.url FROM media_files media
         JOIN attachments attachment ON attachment.media_file_id = media.id
        WHERE attachment.entity_type = 'submission' AND media.url LIKE $1`,
      [`${fromPrefix}%`],
    );
    if (rows.length) await fs.mkdir(toDir, { recursive: true });
    for (const row of rows) {
      const name = path.basename(row.url);
      await fs
        .rename(path.join(fromDir, name), path.join(toDir, name))
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
      await queryRunner.query(`UPDATE media_files SET url = $1 WHERE id = $2`, [
        `${toPrefix}${name}`,
        row.id,
      ]);
    }
  }
}
