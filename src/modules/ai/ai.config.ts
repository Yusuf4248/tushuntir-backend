import { ConfigService } from "@nestjs/config";

/** Vector size of textbook_chunks.embedding; the migration and the embedding model must agree. */
export const EMBEDDING_DIMENSION = 1024;

export const AI_CONFIG = Symbol("AI_CONFIG");

export interface AiConfig {
  provider: string;
  apiKey: string | undefined;
  model: string;
  embeddingModel: string;
  embeddingApiKey: string | undefined;
  timeoutMs: number;
}

export function readAiConfig(config: ConfigService): AiConfig {
  const value = (name: string) => config.get<string>(name)?.trim() || undefined;
  return {
    provider: value("AI_PROVIDER") ?? "anthropic",
    apiKey: value("AI_API_KEY"),
    model: value("AI_MODEL") ?? "claude-haiku-5-5",
    embeddingModel: value("AI_EMBEDDING_MODEL") ?? "voyage-4",
    embeddingApiKey: value("AI_EMBEDDING_API_KEY"),
    timeoutMs: Number(value("AI_TIMEOUT_MS") ?? 60_000),
  };
}
