import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AI_CONFIG, AiConfig, readAiConfig } from "./ai.config";
import { LlmService } from "./llm.service";
import { AnthropicLlmService } from "./providers/anthropic-llm.service";
import { RetrievalService } from "./retrieval.service";
import { OpenAiSttService } from "./speech/providers/openai-stt.service";
import {
  readSpeechConfig,
  SPEECH_CONFIG,
  SpeechConfig,
} from "./speech/speech.config";
import { SttService } from "./speech/stt.service";
import { TtsService } from "./speech/tts.service";
import { TranslationService } from "./translation/translation.service";

export function createLlmService(config: AiConfig): LlmService {
  switch (config.provider) {
    case "anthropic":
      return new AnthropicLlmService(config);
    default:
      throw new Error(
        `AI_PROVIDER "${config.provider}" is not supported (supported: anthropic)`,
      );
  }
}

/** Add another speech-to-text provider (e.g. ElevenLabs Scribe) as a case here. */
export function createSttService(config: SpeechConfig): SttService {
  switch (config.sttProvider) {
    case "openai":
      return new OpenAiSttService(config);
    default:
      throw new Error(
        `STT_PROVIDER "${config.sttProvider}" is not supported (supported: openai)`,
      );
  }
}

/** Shared AI access: inject LlmService. A missing key fails the AI call (503), never app startup. */
@Module({
  providers: [
    { provide: AI_CONFIG, useFactory: readAiConfig, inject: [ConfigService] },
    { provide: LlmService, useFactory: createLlmService, inject: [AI_CONFIG] },
    {
      provide: SPEECH_CONFIG,
      useFactory: readSpeechConfig,
      inject: [ConfigService],
    },
    {
      provide: SttService,
      useFactory: createSttService,
      inject: [SPEECH_CONFIG],
    },
    TtsService,
    TranslationService,
    RetrievalService,
  ],
  exports: [
    LlmService,
    RetrievalService,
    SttService,
    TtsService,
    TranslationService,
    AI_CONFIG,
  ],
})
export class AiModule {}
