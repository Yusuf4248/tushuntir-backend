import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AI_CONFIG, AiConfig, readAiConfig } from "./ai.config";
import { LlmService } from "./llm.service";
import { AnthropicLlmService } from "./providers/anthropic-llm.service";
import { RetrievalService } from "./retrieval.service";

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

/** Shared AI access: inject LlmService. A missing key fails the AI call (503), never app startup. */
@Module({
  providers: [
    { provide: AI_CONFIG, useFactory: readAiConfig, inject: [ConfigService] },
    { provide: LlmService, useFactory: createLlmService, inject: [AI_CONFIG] },
    RetrievalService,
  ],
  exports: [LlmService, RetrievalService, AI_CONFIG],
})
export class AiModule {}
