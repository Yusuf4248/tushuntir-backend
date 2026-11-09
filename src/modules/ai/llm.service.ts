import * as z from "zod";

export type Effort = "low" | "medium" | "high";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  /** Short label for the token-usage log, e.g. "question-generation". */
  purpose: string;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  effort?: Effort;
}

export interface ChatJsonRequest<T> extends ChatRequest {
  schema: z.ZodType<T>;
}

export type EmbeddingInput = "document" | "query";

/**
 * Provider-neutral AI access. AiModule binds it to the implementation named by AI_PROVIDER.
 * Every method throws AiUnavailableException (503) on failure and never anything else.
 */
export abstract class LlmService {
  abstract chat(request: ChatRequest): Promise<string>;

  /** Output is validated against the schema; one retry when the model returns invalid JSON. */
  abstract chatJson<T>(request: ChatJsonRequest<T>): Promise<T>;

  /** One vector of EMBEDDING_DIMENSION numbers per text, in input order. */
  abstract embed(texts: string[], input: EmbeddingInput): Promise<number[][]>;
}
