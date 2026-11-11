import { BadRequestException, PayloadTooLargeException } from "@nestjs/common";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { promisify } from "util";
import { AudioInput } from "./stt.service";

const run = promisify(execFile);

/** Browser recording MIME types (codec parameters stripped) → file extension. */
const AUDIO_TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "application/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

export const AUDIO_MIME_TYPES = Object.keys(AUDIO_TYPES);

/** Limits on a student's recording (cost and abuse protection). */
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 90;
export const AUDIO_TOO_LARGE_MESSAGE =
  "Yozuv hajmi juda katta: 5 MB dan oshmasligi kerak.";

const UNREADABLE = "The recording could not be read; record again or send text";

/** The recording's format, from its MIME type, else its file extension. */
export function audioExtension(audio: AudioInput): string {
  const mime = audio.mimeType.split(";")[0].trim().toLowerCase();
  const fromName = path.extname(audio.originalName).slice(1).toLowerCase();
  const extension =
    AUDIO_TYPES[mime] ??
    (Object.values(AUDIO_TYPES).includes(fromName) ? fromName : undefined);
  if (!extension) {
    throw new BadRequestException(
      `Unsupported audio type (${audio.mimeType}). Send webm, ogg, m4a, mp4, mp3 or wav`,
    );
  }
  return extension;
}

/**
 * Returns the audio unchanged when the provider accepts its format, otherwise converts it to
 * mono 16 kHz mp3 with ffmpeg. The temporary files are always deleted.
 */
export async function ensureAudioFormat(
  audio: AudioInput,
  accepted: string[],
  ffmpegPath: string,
): Promise<{ buffer: Buffer; extension: string }> {
  const extension = audioExtension(audio);
  if (accepted.includes(extension)) return { buffer: audio.buffer, extension };
  const dir = await fs.mkdtemp(path.join(tmpdir(), "stt-"));
  try {
    const input = path.join(dir, `input.${extension}`);
    const output = path.join(dir, "output.mp3");
    await fs.writeFile(input, audio.buffer);
    try {
      await run(
        ffmpegPath,
        [
          "-loglevel",
          "error",
          "-i",
          input,
          "-ac",
          "1",
          "-ar",
          "16000",
          "-b:a",
          "48k",
          output,
        ],
        { timeout: 60_000 },
      );
    } catch {
      throw new BadRequestException(UNREADABLE);
    }
    return { buffer: await fs.readFile(output), extension: "mp3" };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/**
 * Rejects recordings over 5 MB or 90 seconds. The length is measured by decoding the audio,
 * because browser webm recordings usually carry no duration in their header.
 */
export async function checkAudioLimits(
  audio: AudioInput,
  ffmpegPath: string,
): Promise<number> {
  if (audio.buffer.length > MAX_AUDIO_BYTES) {
    throw new PayloadTooLargeException(AUDIO_TOO_LARGE_MESSAGE);
  }
  const extension = audioExtension(audio);
  const dir = await fs.mkdtemp(path.join(tmpdir(), "stt-"));
  try {
    const input = path.join(dir, `input.${extension}`);
    await fs.writeFile(input, audio.buffer);
    let progress: string;
    try {
      ({ stdout: progress } = await run(
        ffmpegPath,
        [
          "-hide_banner",
          "-nostats",
          "-i",
          input,
          "-progress",
          "pipe:1",
          "-f",
          "null",
          "-",
        ],
        { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
      ));
    } catch {
      throw new BadRequestException(UNREADABLE);
    }
    const times = [...progress.matchAll(/out_time_us=(\d+)/g)];
    const seconds = times.length ? Number(times[times.length - 1][1]) / 1e6 : 0;
    if (seconds > MAX_AUDIO_SECONDS) {
      throw new BadRequestException(
        `Yozuv juda uzun: ${MAX_AUDIO_SECONDS} soniyadan oshmasligi kerak. Qisqaroq qilib qayta yozing.`,
      );
    }
    return seconds;
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
