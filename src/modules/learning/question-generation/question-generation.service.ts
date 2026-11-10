import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import * as z from "zod";
import { QuestionStatus, QuestionType } from "../../../common/enums";
import { shuffle } from "../../../common/shuffle";
import { LlmService } from "../../ai/llm.service";
import {
  PromptChunk,
  QUESTION_GENERATION_SYSTEM,
  questionGenerationMessage,
} from "../../ai/prompts/question-generation.prompt";
import {
  QUESTION_SELF_CHECK_SYSTEM,
  questionSelfCheckMessage,
  UNANSWERABLE,
} from "../../ai/prompts/question-self-check.prompt";
import { answersMatch, normalizeAnswer } from "../questions/answer-match";
import { Question } from "../questions/entities/question.entity";

/**
 * True when the text shows "= <answer>" as a complete result, e.g. a worked example that
 * happens to end with the same number. Catches short answers the substring check skips.
 */
export function statesResult(text: string, answer: string): boolean {
  const pattern = answer
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s*");
  return new RegExp(`=\\s*${pattern}(?![\\w/^]|[.,]\\d)`, "i").test(text);
}

/** ~25 questions per run: per difficulty, how many multiple choice and short answer. */
const PLAN = [
  { difficulty: 1, multipleChoice: 6, shortAnswer: 3 },
  { difficulty: 2, multipleChoice: 6, shortAnswer: 2 },
  { difficulty: 3, multipleChoice: 6, shortAnswer: 2 },
];
const GENERATION_TIMEOUT_MS = 180_000;

const GeneratedQuestion = z.object({
  type: z.enum(["multiple_choice", "short_answer"]),
  prompt: z.string(),
  options: z.array(z.string()),
  correct_answer: z.string(),
  hints: z.array(z.string()),
  explanation: z.string(),
  option_misconceptions: z.array(
    z.object({ option: z.string(), misconception: z.string() }),
  ),
  source_chunk_id: z.number(),
});
const GeneratedBatch = z.object({ questions: z.array(GeneratedQuestion) });
const SelfCheck = z.object({
  answers: z.array(z.object({ index: z.number(), answer: z.string() })),
});

type Generated = z.infer<typeof GeneratedQuestion> & { difficulty: number };

export interface DroppedQuestion {
  prompt: string;
  reason: string;
}

export interface GenerationResult {
  topicId: number;
  generated: number;
  saved: number;
  dropped: DroppedQuestion[];
  questions: Question[];
}

/**
 * Generates draft questions for a topic from its textbook chunks, then lets the AI answer
 * each one without the key and keeps only those it answers correctly.
 * Built on LlmService + DataSource only, so the seed script can use it outside Nest.
 */
@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly dataSource: DataSource,
  ) {}

  async generate(topicId: number): Promise<GenerationResult> {
    const [topic]: { id: number; title: string; key_ideas: string[] | null }[] =
      await this.dataSource.query(
        `SELECT id, title, key_ideas FROM topics WHERE id = $1`,
        [topicId],
      );
    if (!topic) throw new NotFoundException(`Topic ${topicId} not found`);
    const chunks: PromptChunk[] = await this.dataSource.query(
      `SELECT id, page, content FROM textbook_chunks WHERE topic_id = $1 ORDER BY position NULLS LAST, id`,
      [topicId],
    );
    if (!chunks.length) {
      throw new BadRequestException(
        `Topic ${topicId} has no textbook text; load it with npm run content:load`,
      );
    }

    const batches = await Promise.all(
      PLAN.map(async (plan) => {
        const batch = await this.llm.chatJson({
          purpose: `question-generation:d${plan.difficulty}`,
          system: QUESTION_GENERATION_SYSTEM,
          messages: [
            {
              role: "user",
              content: questionGenerationMessage({
                topicTitle: topic.title,
                keyIdeas: topic.key_ideas ?? [],
                chunks,
                ...plan,
              }),
            },
          ],
          schema: GeneratedBatch,
          effort: "medium",
          maxTokens: 16_000,
          timeoutMs: GENERATION_TIMEOUT_MS,
        });
        return batch.questions.map((q) => ({
          ...q,
          difficulty: plan.difficulty,
        }));
      }),
    );
    const candidates = batches.flat();

    const dropped: DroppedQuestion[] = [];
    const chunkIds = new Set(chunks.map((c) => c.id));
    const seen = new Set<string>();
    const valid: Generated[] = [];
    for (const question of candidates) {
      const reason = this.problemWith(question, chunkIds, seen);
      if (reason) dropped.push({ prompt: question.prompt, reason });
      else valid.push(question);
    }

    const checked = await this.selfCheck(valid, chunks);
    for (const item of checked.failed) dropped.push(item);

    const saved = checked.passed.length
      ? await this.save(topicId, checked.passed)
      : [];
    this.logger.log(
      `topic ${topicId}: ${candidates.length} generated, ${saved.length} saved, ${dropped.length} dropped`,
    );
    return {
      topicId,
      generated: candidates.length,
      saved: saved.length,
      dropped,
      questions: saved,
    };
  }

  /** Approves every draft question of a topic; returns how many changed. */
  async approveAll(topicId: number, userId: number): Promise<number> {
    const [topic] = await this.dataSource.query(
      `SELECT id FROM topics WHERE id = $1`,
      [topicId],
    );
    if (!topic) throw new NotFoundException(`Topic ${topicId} not found`);
    // TypeORM returns [rows, affected count] for an UPDATE on Postgres.
    const [, approved]: [unknown[], number] = await this.dataSource.query(
      `UPDATE questions SET status = $1, approved_by = $2, approved_at = now()
        WHERE topic_id = $3 AND status = $4`,
      [QuestionStatus.APPROVED, userId, topicId, QuestionStatus.DRAFT],
    );
    return approved;
  }

  /** Structural checks; returns the reason to drop the question, or null to keep it. */
  private problemWith(
    question: Generated,
    chunkIds: Set<number>,
    seen: Set<string>,
  ): string | null {
    const prompt = question.prompt.trim();
    const answer = question.correct_answer.trim();
    if (!prompt || !answer) return "empty prompt or answer";
    const key = normalizeAnswer(prompt);
    if (seen.has(key)) return "duplicate question";
    if (question.hints.length !== 3 || question.hints.some((h) => !h.trim())) {
      return "needs exactly 3 hints";
    }
    if (!chunkIds.has(question.source_chunk_id)) {
      return "source chunk is not part of this topic";
    }
    if (question.type === "multiple_choice") {
      const options = question.options.map((o) => o.trim());
      if (options.length !== 4 || new Set(options).size !== 4) {
        return "needs 4 distinct options";
      }
      if (!options.includes(answer)) return "answer is not one of the options";
      const wrong = options.filter((o) => o !== answer);
      const explained = new Set(
        question.option_misconceptions.map((m) => m.option.trim()),
      );
      if (wrong.some((o) => !explained.has(o))) {
        return "a wrong option has no misconception";
      }
    } else {
      if (question.options.length) return "short answer must have no options";
      if (answer.length > 40) return "short answer is too long to check";
    }
    const normalizedAnswer = normalizeAnswer(answer);
    if (
      (normalizedAnswer.length >= 3 &&
        question.hints.some((h) =>
          normalizeAnswer(h).includes(normalizedAnswer),
        )) ||
      question.hints.some((h) => statesResult(h, answer))
    ) {
      return "a hint gives away the answer";
    }
    seen.add(key);
    return null;
  }

  /** The AI answers each question without the key; mismatches and unanswerable ones are dropped. */
  private async selfCheck(
    questions: Generated[],
    chunks: PromptChunk[],
  ): Promise<{ passed: Generated[]; failed: DroppedQuestion[] }> {
    if (!questions.length) return { passed: [], failed: [] };
    const { answers } = await this.llm.chatJson({
      purpose: "question-self-check",
      system: QUESTION_SELF_CHECK_SYSTEM,
      messages: [
        {
          role: "user",
          content: questionSelfCheckMessage({
            chunks,
            questions: questions.map((q, index) => ({
              index,
              type: q.type,
              prompt: q.prompt,
              options: q.options,
            })),
          }),
        },
      ],
      schema: SelfCheck,
      effort: "medium",
      timeoutMs: GENERATION_TIMEOUT_MS,
    });
    const byIndex = new Map(answers.map((a) => [a.index, a.answer.trim()]));
    const passed: Generated[] = [];
    const failed: DroppedQuestion[] = [];
    questions.forEach((question, index) => {
      const given = byIndex.get(index);
      if (given === undefined) {
        failed.push({
          prompt: question.prompt,
          reason: "self-check gave no answer",
        });
      } else if (given === UNANSWERABLE) {
        failed.push({
          prompt: question.prompt,
          reason: "not answerable from the textbook text",
        });
      } else if (!answersMatch(given, question.correct_answer)) {
        failed.push({
          prompt: question.prompt,
          reason: `self-check answered "${given}", key is "${question.correct_answer}"`,
        });
      } else {
        passed.push(question);
      }
    });
    return { passed, failed };
  }

  private async save(
    topicId: number,
    questions: Generated[],
  ): Promise<Question[]> {
    const repository = this.dataSource.getRepository(Question);
    const rows = questions.map((q) => {
      const answer = q.correct_answer.trim();
      const multipleChoice = q.type === "multiple_choice";
      return repository.create({
        topicId,
        type: multipleChoice
          ? QuestionType.MULTIPLE_CHOICE
          : QuestionType.SHORT_ANSWER,
        prompt: q.prompt.trim(),
        // Models tend to list the correct option first.
        options: multipleChoice
          ? shuffle(q.options.map((o) => o.trim()))
          : null,
        correctAnswer: answer,
        hint: q.hints[0].trim(),
        hints: q.hints.map((h) => h.trim()),
        explanation: q.explanation.trim() || null,
        optionMisconceptions: multipleChoice
          ? Object.fromEntries(
              q.option_misconceptions
                .filter((m) => m.option.trim() !== answer)
                .map((m) => [m.option.trim(), m.misconception.trim()]),
            )
          : null,
        difficulty: q.difficulty,
        sourceChunkId: q.source_chunk_id,
        generatedByAi: true,
        status: QuestionStatus.DRAFT,
      });
    });
    return repository.save(rows);
  }
}
