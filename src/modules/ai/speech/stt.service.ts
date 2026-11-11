export interface AudioInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

export interface TranscribeOptions {
  /**
   * Words of the topic in Uzbek. OpenAI rejects "uz" as a language hint, and without one
   * Uzbek is often written as Azerbaijani or Turkish; a short Uzbek prompt fixes that.
   */
  prompt?: string;
}

/**
 * Provider-neutral speech-to-text. AiModule binds it to the provider named by STT_PROVIDER.
 * The audio is only held in memory (and a temporary file while ffmpeg converts it);
 * nothing is kept after transcription.
 * Recordings over 5 MB (413) or 90 seconds (400) are rejected before the provider is called.
 * Throws AiUnavailableException (503) when the provider fails, BadRequestException when the
 * recording cannot be read.
 */
export abstract class SttService {
  abstract transcribe(
    audio: AudioInput,
    options?: TranscribeOptions,
  ): Promise<string>;
}
