import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

/**
 * Files are stored on local disk (UPLOADS_DIR, default ./uploads) and public ones are served by
 * main.ts under /uploads. Read when used, so a value from .env (loaded by ConfigModule) is seen
 * too. On a host without a persistent disk everything here is lost on restart or redeploy.
 */
export function uploadsDir(): string {
  return path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR?.trim() || "uploads",
  );
}
export const UPLOAD_URL_PREFIX = "/uploads";

/**
 * Private files (homework submissions) live in <UPLOADS_DIR>/private, which main.ts never serves;
 * their stored url is "private/<name>" and they are downloaded through /api/files.
 */
export const PRIVATE_URL_PREFIX = "private/";
export function privateDir(): string {
  return path.join(uploadsDir(), "private");
}

/** Absolute path of a stored file url (public "/uploads/<name>" or "private/<name>"), else null. */
export function storedFilePath(url: string): string | null {
  if (url.startsWith(`${UPLOAD_URL_PREFIX}/`)) {
    return path.join(uploadsDir(), path.basename(url));
  }
  if (url.startsWith(PRIVATE_URL_PREFIX)) {
    return path.join(privateDir(), path.basename(url));
  }
  return null;
}
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** MIME type -> accepted extensions. SVG is deliberately not allowed. */
export const ALLOWED_UPLOADS: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "video/mp4": [".mp4"],
};

export interface StoredFile {
  /** Public: relative URL, e.g. /uploads/3f1c....pdf (no domain). Private: private/3f1c....pdf */
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

@Injectable()
export class FileService {
  /** Validates and stores an upload; `private` files are kept out of the public /uploads route. */
  async save(
    file: Express.Multer.File | undefined,
    options: { private?: boolean } = {},
  ): Promise<StoredFile> {
    if (!file)
      throw new BadRequestException("A file is required (field name: file)");
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = ALLOWED_UPLOADS[file.mimetype];
    if (!allowed || !allowed.includes(extension)) {
      throw new BadRequestException(
        `File type not allowed (${file.mimetype}, ${extension || "no extension"}). ` +
          "Allowed: jpg, png, webp, gif, pdf, docx, pptx, xlsx, mp4",
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException("File is larger than 20 MB");
    }
    const storedName = `${randomUUID()}${extension}`;
    const dir = options.private ? privateDir() : uploadsDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, storedName), file.buffer);
    return {
      url: options.private
        ? `${PRIVATE_URL_PREFIX}${storedName}`
        : `${UPLOAD_URL_PREFIX}/${storedName}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      originalName: file.originalname,
    };
  }

  /** Absolute path for a stored URL, or null if the URL is not an upload. */
  pathOf(url: string): string | null {
    return storedFilePath(url);
  }

  async remove(url: string): Promise<void> {
    const filePath = this.pathOf(url);
    if (filePath) await fs.rm(filePath, { force: true });
  }
}
