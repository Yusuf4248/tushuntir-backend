import { ConfigService } from "@nestjs/config";

/** The ffmpeg binary that the ffmpeg-static package downloads on npm install (null if unavailable). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bundledFfmpeg = require("ffmpeg-static") as string | null;

export const SPEECH_CONFIG = Symbol("SPEECH_CONFIG");

export interface SpeechConfig {
  /** Speech-to-text provider: openai (more can be added in createSttService). */
  sttProvider: string;
  sttApiKey: string | undefined;
  sttModel: string;
  sttTimeoutMs: number;
  /**
   * ffmpeg converts recordings the provider does not accept (e.g. ogg) and measures their length:
   * FFMPEG_PATH, else the ffmpeg-static binary, else "ffmpeg" on the PATH.
   */
  ffmpegPath: string;
  /** Edge text-to-speech voice for Sardor. */
  ttsVoice: string;
}

export function readSpeechConfig(config: ConfigService): SpeechConfig {
  const value = (name: string) => config.get<string>(name)?.trim() || undefined;
  return {
    sttProvider: value("STT_PROVIDER") ?? "openai",
    sttApiKey: value("STT_API_KEY"),
    sttModel: value("STT_MODEL") ?? "gpt-transcribe",
    sttTimeoutMs: Number(value("STT_TIMEOUT_MS") ?? 60_000),
    ffmpegPath: value("FFMPEG_PATH") ?? bundledFfmpeg ?? "ffmpeg",
    ttsVoice: value("TTS_VOICE") ?? "uz-UZ-SardorNeural",
  };
}
