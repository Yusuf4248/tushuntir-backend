import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

/** Files are stored on local disk and served by main.ts under /uploads. */
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
export const UPLOAD_URL_PREFIX = "/uploads";
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
  /** Relative URL, e.g. /uploads/3f1c....pdf (no domain). */
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

@Injectable()
export class FileService {
  async save(file: Express.Multer.File | undefined): Promise<StoredFile> {
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
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, storedName), file.buffer);
    return {
      url: `${UPLOAD_URL_PREFIX}/${storedName}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      originalName: file.originalname,
    };
  }

  /** Absolute path for a stored URL, or null if the URL is not an upload. */
  pathOf(url: string): string | null {
    if (!url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return null;
    const name = path.basename(url);
    return path.join(UPLOAD_DIR, name);
  }

  async remove(url: string): Promise<void> {
    const filePath = this.pathOf(url);
    if (filePath) await fs.rm(filePath, { force: true });
  }
}
