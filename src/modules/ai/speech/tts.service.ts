import { Inject, Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import * as path from "path";
import {
  UPLOAD_DIR,
  UPLOAD_URL_PREFIX,
} from "../../../shared/file/file.service";
import { SPEECH_CONFIG, SpeechConfig } from "./speech.config";

const TTS_DIR = path.join(UPLOAD_DIR, "tts");

/** Text is placed inside SSML, so XML characters must be escaped. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Sardor's lines read aloud with Microsoft Edge's online voices (msedge-tts, TTS_VOICE).
 * That endpoint is unofficial: fine for the demo, to be replaced by a paid TTS in production.
 * Files are cached per voice and text under /uploads/tts, so each line is synthesised once.
 */
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(@Inject(SPEECH_CONFIG) private readonly config: SpeechConfig) {}

  /** Relative URL of the mp3, or null when synthesis fails (the text still works without it). */
  async speak(text: string): Promise<string | null> {
    const name = `${createHash("sha256")
      .update(`${this.config.ttsVoice}\n${text}`)
      .digest("hex")
      .slice(0, 32)}.mp3`;
    const file = path.join(TTS_DIR, name);
    const url = `${UPLOAD_URL_PREFIX}/tts/${name}`;
    try {
      await fs.access(file);
      return url;
    } catch {
      // not cached yet
    }
    const started = Date.now();
    try {
      const audio = await this.synthesize(text);
      await fs.mkdir(TTS_DIR, { recursive: true });
      const partial = `${file}.${process.pid}.part`;
      await fs.writeFile(partial, audio);
      await fs.rename(partial, file);
      this.logger.log(
        `tts voice=${this.config.ttsVoice} chars=${text.length} bytes=${audio.length} ms=${Date.now() - started}`,
      );
      return url;
    } catch (error) {
      this.logger.warn(`tts failed: ${(error as Error).message}`);
      return null;
    }
  }

  private async synthesize(text: string): Promise<Buffer> {
    const tts = new MsEdgeTTS({
      connectionTimeoutMs: 10_000,
      synthesisTimeoutMs: 20_000,
    });
    try {
      await tts.setMetadata(
        this.config.ttsVoice,
        OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
      );
      const { audioStream } = tts.toStream(escapeXml(text));
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) chunks.push(chunk as Buffer);
      const audio = Buffer.concat(chunks);
      if (!audio.length) throw new Error("no audio returned");
      return audio;
    } finally {
      tts.close();
    }
  }
}
