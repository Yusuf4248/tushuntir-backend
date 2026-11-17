import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";

const HOUR_SECONDS = 3600;

/**
 * Signed, expiring links to private files (homework submissions), usable directly in <img> and
 * <a> where no Authorization header can be sent. The key is derived from JWT_ACCESS_SECRET, so
 * rotating that secret also invalidates every link. A link expires at the end of the next full
 * hour (valid 1-2 hours), so it stays the same within an hour and browsers can cache the file.
 */
@Injectable()
export class FileLinksService {
  constructor(private readonly config: ConfigService) {}

  /** Relative URL: /api/files/signed/<id>?expires=<unix seconds>&sig=<hmac> */
  signedUrl(mediaFileId: number, now = Date.now()): string {
    const expires = (Math.floor(now / 1000 / HOUR_SECONDS) + 2) * HOUR_SECONDS;
    return `/api/files/signed/${mediaFileId}?expires=${expires}&sig=${this.sign(mediaFileId, expires)}`;
  }

  /** True when the signature matches and the link has not expired. */
  verify(mediaFileId: number, expires: number, signature: string): boolean {
    if (!Number.isInteger(expires) || expires * 1000 < Date.now()) return false;
    const expected = Buffer.from(this.sign(mediaFileId, expires));
    const given = Buffer.from(signature ?? "");
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  private sign(mediaFileId: number, expires: number): string {
    const key = createHmac(
      "sha256",
      this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    )
      .update("tushuntir:file-links")
      .digest();
    return createHmac("sha256", key)
      .update(`${mediaFileId}.${expires}`)
      .digest("base64url");
  }
}
