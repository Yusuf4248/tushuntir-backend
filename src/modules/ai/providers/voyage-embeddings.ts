import { Logger } from "@nestjs/common";
import { AiConfig, EMBEDDING_DIMENSION } from "../ai.config";
import { AiUnavailableException } from "../ai.errors";
import { EmbeddingInput } from "../llm.service";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const BATCH_SIZE = 128;
const MAX_RATE_LIMIT_WAIT_MS = 20_000;

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage?: { total_tokens?: number };
}

/** Embeddings for the Anthropic provider (Anthropic has no embeddings API; Voyage is its recommended partner). */
export class VoyageEmbeddings {
  private readonly logger = new Logger("LlmService");

  constructor(private readonly config: AiConfig) {}

  async embed(texts: string[], input: EmbeddingInput): Promise<number[][]> {
    if (!this.config.embeddingApiKey) {
      throw new AiUnavailableException("AI_EMBEDDING_API_KEY is not set");
    }
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      vectors.push(
        ...(await this.embedBatch(
          texts.slice(start, start + BATCH_SIZE),
          input,
        )),
      );
    }
    return vectors;
  }

  private async embedBatch(
    texts: string[],
    input: EmbeddingInput,
  ): Promise<number[][]> {
    const started = Date.now();
    let response = await this.post(texts, input);
    if (response.status === 429) {
      // Low-tier Voyage keys allow only a few requests a minute: wait once as told, then retry.
      const waitMs = Math.min(
        (Number(response.headers.get("retry-after")) || 20) * 1000,
        MAX_RATE_LIMIT_WAIT_MS,
      );
      this.logger.warn(
        `embedding rate limit reached; retrying in ${waitMs / 1000}s`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      response = await this.post(texts, input);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      this.logger.error(
        `embedding request returned ${response.status}: ${detail}`,
      );
      throw new AiUnavailableException(
        response.status === 401
          ? "invalid AI_EMBEDDING_API_KEY"
          : response.status === 429
            ? "embedding rate limit reached, try again shortly"
            : `embedding service error ${response.status}`,
      );
    }
    const body = (await response.json()) as VoyageResponse;
    const vectors = [...body.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
    if (
      vectors.length !== texts.length ||
      vectors.some((vector) => vector.length !== EMBEDDING_DIMENSION)
    ) {
      throw new AiUnavailableException(
        `embedding model ${this.config.embeddingModel} did not return ${texts.length} vectors of ${EMBEDDING_DIMENSION} numbers`,
      );
    }
    this.logger.log(
      `purpose=embed:${input} model=${this.config.embeddingModel} texts=${texts.length} tokens=${body.usage?.total_tokens ?? "?"} ms=${Date.now() - started}`,
    );
    return vectors;
  }

  private async post(
    texts: string[],
    input: EmbeddingInput,
  ): Promise<Response> {
    try {
      return await fetch(VOYAGE_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.embeddingApiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: this.config.embeddingModel,
          input_type: input,
          output_dimension: EMBEDDING_DIMENSION,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      this.logger.error(`embedding request failed: ${String(error)}`);
      throw new AiUnavailableException(
        timedOut
          ? "embedding request timed out"
          : "embedding service unreachable",
      );
    }
  }
}
