import { ConfigService } from "@nestjs/config";

export const SPEECH_CONFIG = Symbol("SPEECH_CONFIG");

export interface SpeechConfig {
  /** Speech-to-text provider: openai (more can be added in createSttService). */
  sttProvider: string;
  sttApiKey: string | undefined;
  sttModel: string;
  sttTimeoutMs: number;
  /** ffmpeg converts browser recordings the provider does not accept (e.g. ogg). */
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
    ffmpegPath: value("FFMPEG_PATH") ?? "ffmpeg",
    ttsVoice: value("TTS_VOICE") ?? "uz-UZ-SardorNeural",
  };
}
