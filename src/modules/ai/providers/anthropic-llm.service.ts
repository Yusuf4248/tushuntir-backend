import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Logger } from "@nestjs/common";
import { AiConfig } from "../ai.config";
import { AiUnavailableException } from "../ai.errors";
import {
  ChatJsonRequest,
  ChatRequest,
  EmbeddingInput,
  LlmService,
} from "../llm.service";
import { VoyageEmbeddings } from "./voyage-embeddings";

const DEFAULT_MAX_TOKENS = 16_000;

/** Claude for chat (AI_MODEL, default claude-haiku-5-5) and Voyage for embeddings. */
export class AnthropicLlmService extends LlmService {
  private readonly logger = new Logger("LlmService");
  private readonly client: Anthropic | null;
  private readonly embeddings: VoyageEmbeddings;

  constructor(private readonly config: AiConfig) {
    super();
    this.client = config.apiKey
      ? new Anthropic({
          apiKey: config.apiKey,
          timeout: config.timeoutMs,
          maxRetries: 1,
        })
      : null;
    this.embeddings = new VoyageEmbeddings(config);
  }

  async chat(request: ChatRequest): Promise<string> {
    let message: Anthropic.Message;
    try {
      message = await this.send(request, (client, params, options) =>
        client.messages.create(params, options),
      );
    } catch (error) {
      if (error instanceof AiUnavailableException) throw error;
      this.logger.error(`purpose=${request.purpose} failed: ${String(error)}`);
      throw new AiUnavailableException("unexpected AI error");
    }
    if (message.stop_reason === "max_tokens") {
      this.logger.warn(
        `purpose=${request.purpose} reply cut off at max_tokens`,
      );
    }
    return message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  }

  async chatJson<T>(request: ChatJsonRequest<T>): Promise<T> {
    let maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
    for (let attempt = 1; attempt <= 2; attempt++) {
      let problem: string;
      try {
        const message = await this.send(
          { ...request, maxTokens },
          (client, params, options) =>
            client.messages.parse(
              {
                ...params,
                output_config: {
                  ...params.output_config,
                  format: zodOutputFormat(request.schema),
                },
              },
              options,
            ),
        );
        const parsed = request.schema.safeParse(message.parsed_output);
        if (parsed.success) return parsed.data;
        if (message.stop_reason === "max_tokens") {
          problem = "output cut off at max_tokens";
          maxTokens *= 2;
        } else {
          problem = parsed.error.message.slice(0, 300);
        }
      } catch (error) {
        if (error instanceof AiUnavailableException) throw error;
        problem = String(error).slice(0, 300);
      }
      this.logger.warn(
        `purpose=${request.purpose} invalid JSON on attempt ${attempt}: ${problem}`,
      );
    }
    throw new AiUnavailableException("the AI returned invalid output twice");
  }

  embed(texts: string[], input: EmbeddingInput): Promise<number[][]> {
    return this.embeddings.embed(texts, input);
  }

  /** Sends one request, logs token usage, and turns provider errors into AiUnavailableException. */
  private async send<M extends Anthropic.Message>(
    request: ChatRequest,
    call: (
      client: Anthropic,
      params: Anthropic.MessageCreateParamsNonStreaming,
      options: Anthropic.RequestOptions,
    ) => Promise<M>,
  ): Promise<M> {
    if (!this.client) throw new AiUnavailableException("AI_API_KEY is not set");
    const started = Date.now();
    let message: M;
    try {
      message = await call(
        this.client,
        {
          model: this.config.model,
          max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
          system: request.system,
          messages: request.messages,
          output_config: { effort: request.effort ?? "low" },
        },
        { timeout: request.timeoutMs ?? this.config.timeoutMs },
      );
    } catch (error) {
      throw this.toAiError(request.purpose, error);
    }
    const usage = message.usage;
    this.logger.log(
      `purpose=${request.purpose} model=${message.model} input=${usage.input_tokens} output=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} stop=${message.stop_reason} ms=${Date.now() - started}`,
    );
    if (message.stop_reason === "refusal") {
      throw new AiUnavailableException("the AI declined this request");
    }
    return message;
  }

  /** Provider errors become a 503 with a short reason; anything else is passed through unchanged. */
  private toAiError(purpose: string, error: unknown): unknown {
    if (!(error instanceof Anthropic.APIError)) return error;
    this.logger.error(`purpose=${purpose} failed: ${error.message}`);
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return new AiUnavailableException("the AI request timed out");
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return new AiUnavailableException("the AI service is unreachable");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return new AiUnavailableException("invalid AI_API_KEY");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return new AiUnavailableException(
        "AI rate limit reached, try again shortly",
      );
    }
    return new AiUnavailableException(`AI provider error ${error.status}`);
  }
}
