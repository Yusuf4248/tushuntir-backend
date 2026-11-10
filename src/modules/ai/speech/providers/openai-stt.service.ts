import { BadRequestException, Logger } from "@nestjs/common";
import { AiUnavailableException } from "../../ai.errors";
import { ensureAudioFormat } from "../audio-format";
import { SpeechConfig } from "../speech.config";
import { AudioInput, SttService, TranscribeOptions } from "../stt.service";

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
/** Formats the transcription endpoint accepts as they are; others go through ffmpeg. */
const ACCEPTED = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"];
const MAX_BYTES = 25 * 1024 * 1024;

/** OpenAI transcription (STT_MODEL, gpt-transcribe by default; whisper-1 also works). */
export class OpenAiSttService extends SttService {
  private readonly logger = new Logger(OpenAiSttService.name);

  constructor(private readonly config: SpeechConfig) {
    super();
  }

  async transcribe(
    audio: AudioInput,
    options: TranscribeOptions = {},
  ): Promise<string> {
    if (!this.config.sttApiKey) {
      throw new AiUnavailableException("STT_API_KEY is not set");
    }
    const { buffer, extension } = await ensureAudioFormat(
      audio,
      ACCEPTED,
      this.config.ffmpegPath,
    );
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException("The recording is longer than allowed");
    }
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(buffer)]),
      `recording.${extension}`,
    );
    form.append("model", this.config.sttModel);
    if (options.prompt) form.append("prompt", options.prompt);

    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { authorization: `Bearer ${this.config.sttApiKey}` },
        body: form,
        signal: AbortSignal.timeout(this.config.sttTimeoutMs),
      });
    } catch (error) {
      this.logger.warn(`transcription request failed: ${String(error)}`);
      throw new AiUnavailableException("speech recognition did not respond");
    }
    const body = await response.text();
    const ms = Date.now() - started;
    if (!response.ok) {
      this.logger.warn(
        `transcription failed: status=${response.status} ms=${ms} ${body.slice(0, 300)}`,
      );
      if (response.status === 400) {
        throw new BadRequestException(
          "The recording could not be read; record again or send text",
        );
      }
      throw new AiUnavailableException(
        `speech recognition failed (${response.status})`,
      );
    }
    const text = (JSON.parse(body) as { text?: string }).text ?? "";
    this.logger.log(
      `transcribed model=${this.config.sttModel} bytes=${buffer.length} format=${extension} chars=${text.length} ms=${ms}`,
    );
    return text;
  }
}
