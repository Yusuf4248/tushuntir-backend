import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import * as z from "zod";
import { AuthUser } from "../../common/auth/auth-user";
import { QuestionType } from "../../common/enums";
import { AiUnavailableException } from "../ai/ai.errors";
import { LlmService } from "../ai/llm.service";
import {
  MISTAKE_EXPLANATION_SYSTEM,
  mistakeExplanationMessage,
} from "../ai/prompts/mistake-explanation.prompt";
import {
  SAME_SKILL_MATCH_SYSTEM,
  sameSkillMatchMessage,
} from "../ai/prompts/same-skill-match.prompt";
import { QuestionGenerationService } from "../learning/question-generation/question-generation.service";
import {
  ConfirmationStatus,
  ConfirmResultDto,
  MistakeDto,
  ReviewDto,
} from "./dto/review.dto";
import { bestParagraph, chunkParagraphs, StoredChunk } from "./paragraphs";
import { AnswerRow, StudentAttemptsService } from "./student-attempts.service";

const MistakeExplanations = z.object({
  explanations: z.array(
    z.object({ index: z.number(), explanation: z.string() }),
  ),
});

const UNANSWERED = "Bu savolga javob berilmagan.";

const SameSkillMatches = z.object({
  matches: z.array(
    z.object({ index: z.number(), candidate_id: z.number().nullable() }),
  ),
});

/** Pool questions shown to the matcher per mistake. */
const MAX_CANDIDATES = 40;

interface VariantResult {
  variants: Map<number, VariantRow>;
  /** Originals for which no confirmation question exists (cached as confirmation_unavailable_at) */
  unavailable: Set<number>;
}

interface VariantRow {
  id: number;
  variant_of_id: number;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correct_answer: string;
  hints: string[] | null;
  explanation: string | null;
}

/**
 * Mistake review after submit: what went wrong in each wrong answer, plus one confirmation
 * question per mistake (same skill, new numbers). Explanations and confirmation questions are
 * generated once and cached (attempt_answers.mistake_explanation, questions.variant_of_id).
 */
@Injectable()
export class StudentReviewService {
  private readonly logger = new Logger(StudentReviewService.name);
  private readonly inFlight = new Map<string, Promise<ReviewDto>>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly attempts: StudentAttemptsService,
    private readonly generation: QuestionGenerationService,
    private readonly llm: LlmService,
  ) {}

  /**
   * A review still being prepared for the same attempt (e.g. the prewarm started at submit) is
   * shared, so its explanations and confirmation questions are generated once.
   */
  async review(attemptId: number, user: AuthUser): Promise<ReviewDto> {
    const key = `${user.id}:${attemptId}`;
    const running = this.inFlight.get(key);
    if (running) return running;
    const review = this.buildReview(attemptId, user).finally(() =>
      this.inFlight.delete(key),
    );
    this.inFlight.set(key, review);
    return review;
  }

  private async buildReview(
    attemptId: number,
    user: AuthUser,
  ): Promise<ReviewDto> {
    const attempt = await this.attempts.ownAttempt(attemptId, user);
    if (!attempt.finished_at) {
      throw new ConflictException(
        "The review opens after you submit the attempt",
      );
    }
    const rows = await this.attempts.answers(
      this.dataSource.manager,
      attempt.id,
    );
    const wrong = rows
      .map((row, index) => ({ row, position: index + 1 }))
      .filter(({ row }) => row.isCorrect !== true);
    const explanations = await this.ensureExplanations(wrong.map((w) => w.row));
    const { variants, unavailable } = await this.ensureVariants(
      wrong.map((w) => w.row),
      rows.map((r) => r.questionId),
      explanations,
    );
    const sources = await this.sourceParagraphs(wrong.map((w) => w.row));
    const mistakes: MistakeDto[] = wrong.map(({ row, position }) => {
      const variant = variants.get(row.questionId);
      const source = sources.get(row.answerId);
      return {
        questionId: row.questionId,
        position,
        type: row.type,
        prompt: row.prompt,
        options: this.attempts.optionsFor(row),
        yourAnswer: row.answer,
        correctAnswer: row.correctAnswer,
        misconception: explanations.get(row.answerId)!,
        explanation: row.explanation,
        page: source?.page ?? row.page,
        paragraphId: source?.id ?? null,
        fixed: row.fixedAt !== null,
        confirmationStatus: variant
          ? ConfirmationStatus.READY
          : unavailable.has(row.questionId)
            ? ConfirmationStatus.NONE
            : ConfirmationStatus.PENDING,
        confirmation: variant
          ? {
              questionId: variant.id,
              type: variant.type,
              prompt: variant.prompt,
              options: variant.options
                ? this.attempts.optionsFor({
                    options: variant.options,
                    answerId: row.answerId,
                  })
                : null,
            }
          : null,
      };
    });
    const [topic] = attempt.topic_id
      ? await this.dataSource.query(`SELECT title FROM topics WHERE id = $1`, [
          attempt.topic_id,
        ])
      : [];
    return {
      topicId: attempt.topic_id,
      topicTitle: topic?.title ?? null,
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      scorePercent: Number(attempt.score_percent ?? 0),
      totalMistakes: mistakes.length,
      fixedCount: mistakes.filter((m) => m.fixed).length,
      mistakes,
    };
  }

  /** The paragraph of its source chunk each wrong answer's question was written from. */
  private async sourceParagraphs(
    rows: AnswerRow[],
  ): Promise<Map<number, { id: string; page: number | null }>> {
    const ids = [
      ...new Set(rows.map((r) => r.sourceChunkId).filter((id) => id !== null)),
    ];
    const chunks: StoredChunk[] = ids.length
      ? await this.dataSource.query(
          `SELECT id, page, content, paragraph_pages FROM textbook_chunks WHERE id = ANY($1)`,
          [ids],
        )
      : [];
    const byId = new Map(chunks.map((c) => [c.id, chunkParagraphs(c)]));
    const result = new Map<number, { id: string; page: number | null }>();
    for (const row of rows) {
      const paragraphs = row.sourceChunkId
        ? byId.get(row.sourceChunkId)
        : undefined;
      const best = paragraphs
        ? bestParagraph(
            paragraphs,
            [row.prompt, row.correctAnswer, row.explanation ?? ""].join(" "),
          )
        : null;
      if (best) result.set(row.answerId, { id: best.id, page: best.page });
    }
    return result;
  }

  /** Answers the confirmation question of one mistake; a correct answer marks the mistake fixed. */
  async confirm(
    attemptId: number,
    questionId: number,
    answer: string,
    user: AuthUser,
  ): Promise<ConfirmResultDto> {
    const attempt = await this.attempts.ownAttempt(attemptId, user);
    if (!attempt.finished_at) {
      throw new ConflictException(
        "The review opens after you submit the attempt",
      );
    }
    const rows = await this.attempts.answers(
      this.dataSource.manager,
      attempt.id,
    );
    const row = rows.find(
      (r) => r.questionId === questionId && r.isCorrect !== true,
    );
    if (!row) {
      throw new NotFoundException(
        `Question ${questionId} is not a mistake in attempt ${attemptId}`,
      );
    }
    const { variants, unavailable } = await this.ensureVariants(
      [row],
      rows.map((r) => r.questionId),
    );
    const variant = variants.get(questionId);
    if (!variant) {
      throw new ConflictException(
        unavailable.has(questionId)
          ? "This mistake has no confirmation question (confirmationStatus none); continue with the explanation"
          : "No confirmation question for this mistake yet; open the review again in a moment",
      );
    }
    if (row.fixedAt) {
      return {
        questionId,
        correct: true,
        fixed: true,
        explanation: variant.explanation,
        hint: null,
        feedback: null,
      };
    }
    const given = answer.trim();
    let correct: boolean;
    let feedback: string | null = null;
    if (variant.type === QuestionType.MULTIPLE_CHOICE) {
      if (!(variant.options ?? []).map((o) => o.trim()).includes(given)) {
        throw new BadRequestException("answer must be one of the options");
      }
      correct = given === variant.correct_answer.trim();
    } else {
      ({ isCorrect: correct, feedback } = await this.attempts.checkShortAnswer(
        {
          prompt: variant.prompt,
          correctAnswer: variant.correct_answer,
          questionId: variant.id,
        },
        given,
      ));
    }
    if (correct) {
      await this.dataSource.query(
        `UPDATE attempt_answers SET fixed_at = now() WHERE id = $1 AND fixed_at IS NULL`,
        [row.answerId],
      );
    }
    return {
      questionId,
      correct,
      fixed: correct,
      explanation: correct ? variant.explanation : null,
      hint: correct ? null : (variant.hints?.[0] ?? null),
      feedback,
    };
  }

  /**
   * The misconception text per attempt answer: the stored option misconception for a wrong
   * option, otherwise an AI explanation (cached in attempt_answers.mistake_explanation).
   */
  private async ensureExplanations(
    rows: AnswerRow[],
  ): Promise<Map<number, string>> {
    const result = new Map<number, string>();
    const missing: AnswerRow[] = [];
    for (const row of rows) {
      const stored =
        row.answer === null
          ? UNANSWERED
          : (row.mistakeExplanation ??
            (row.type === QuestionType.MULTIPLE_CHOICE
              ? row.optionMisconceptions?.[row.answer]
              : undefined));
      if (stored) result.set(row.answerId, stored);
      else missing.push(row);
    }
    if (missing.length) {
      const text =
        (
          await this.dataSource.query(
            `SELECT string_agg(content, E'\\n\\n' ORDER BY position NULLS LAST, id) AS text
             FROM textbook_chunks WHERE topic_id = ANY($1)`,
            [[...new Set(missing.map((r) => r.topicId))]],
          )
        )[0]?.text ?? "";
      try {
        const { explanations } = await this.llm.chatJson({
          purpose: "mistake-explanation",
          system: MISTAKE_EXPLANATION_SYSTEM,
          messages: [
            {
              role: "user",
              content: mistakeExplanationMessage({
                text,
                items: missing.map((r, index) => ({
                  index,
                  prompt: r.prompt,
                  correctAnswer: r.correctAnswer,
                  studentAnswer: r.answer!,
                })),
              }),
            },
          ],
          schema: MistakeExplanations,
          effort: "low",
          maxTokens: 4_000,
        });
        const byIndex = new Map(
          explanations.map((e) => [e.index, e.explanation.trim()]),
        );
        for (const [index, row] of missing.entries()) {
          const explanation = byIndex.get(index);
          if (!explanation) continue;
          await this.dataSource.query(
            `UPDATE attempt_answers SET mistake_explanation = $1 WHERE id = $2`,
            [explanation, row.answerId],
          );
          result.set(row.answerId, explanation);
        }
      } catch (error) {
        if (!(error instanceof AiUnavailableException)) throw error;
        this.logger.warn(`mistake explanations unavailable: ${error.message}`);
      }
    }
    // Without the AI, fall back to the short-answer feedback or the question's explanation.
    for (const row of missing) {
      if (!result.has(row.answerId)) {
        result.set(
          row.answerId,
          row.aiFeedback ?? row.explanation ?? "Javobingiz noto'g'ri.",
        );
      }
    }
    return result;
  }

  /**
   * Cached confirmation question per original question. Missing ones are generated once; when
   * no generated one passes the checks, an approved pool question testing the same skill is
   * used, and when none does, the original is marked confirmation_unavailable_at.
   */
  private async ensureVariants(
    rows: AnswerRow[],
    attemptQuestionIds: number[],
    misconceptions = new Map<number, string>(),
  ): Promise<VariantResult> {
    const ids = rows.map((r) => r.questionId);
    const load = async () =>
      new Map(
        (
          (await this.dataSource.query(
            `SELECT DISTINCT ON (variant_of_id) id, variant_of_id, type, prompt, options,
                    correct_answer, hints, explanation
               FROM questions
              WHERE variant_of_id = ANY($1) AND status <> 'rejected'
              ORDER BY variant_of_id, id`,
            [ids],
          )) as VariantRow[]
        ).map((v) => [v.variant_of_id, v]),
      );
    let variants = await load();
    const unavailable = new Set<number>(
      (
        (await this.dataSource.query(
          `SELECT id FROM questions WHERE id = ANY($1) AND confirmation_unavailable_at IS NOT NULL`,
          [ids],
        )) as { id: number }[]
      ).map((r) => r.id),
    );
    const missing = rows.filter(
      (r) => !variants.has(r.questionId) && !unavailable.has(r.questionId),
    );
    if (!missing.length) return { variants, unavailable };
    try {
      await this.generation.generateVariants(
        missing.map((r) => ({
          id: r.questionId,
          topicId: r.topicId,
          type: r.type,
          prompt: r.prompt,
          options: r.options,
          correctAnswer: r.correctAnswer,
          difficulty: r.difficulty,
        })),
      );
      variants = await load();
      const stillMissing = missing.filter((r) => !variants.has(r.questionId));
      if (stillMissing.length) {
        const matches = await this.matchSameSkill(
          stillMissing,
          attemptQuestionIds,
          misconceptions,
        );
        for (const row of stillMissing) {
          const candidate = matches.get(row.questionId);
          if (candidate) {
            await this.copyAsVariant(candidate, row.questionId);
          } else {
            await this.dataSource.query(
              `UPDATE questions SET confirmation_unavailable_at = now() WHERE id = $1`,
              [row.questionId],
            );
            unavailable.add(row.questionId);
            this.logger.log(
              `no confirmation question for ${row.questionId}: nothing in the pool tests the same skill`,
            );
          }
        }
        variants = await load();
      }
    } catch (error) {
      // AI down: leave these pending (not marked) so the next review tries again.
      if (!(error instanceof AiUnavailableException)) throw error;
      this.logger.warn(`confirmation questions unavailable: ${error.message}`);
    }
    return { variants, unavailable };
  }

  /**
   * Asks the AI which approved pool question (same topic, not in this attempt) tests the same
   * skill as each mistake. Returns original id → pool question id; no entry means none matches.
   */
  private async matchSameSkill(
    rows: AnswerRow[],
    attemptQuestionIds: number[],
    misconceptions: Map<number, string>,
  ): Promise<Map<number, number>> {
    const pool: {
      id: number;
      topic_id: number;
      type: string;
      prompt: string;
      options: string[] | null;
    }[] = await this.dataSource.query(
      `SELECT id, topic_id, type, prompt, options FROM questions
        WHERE topic_id = ANY($1) AND status = 'approved' AND variant_of_id IS NULL AND id <> ALL($2)
        ORDER BY id`,
      [
        [...new Set(rows.map((r) => r.topicId))],
        // Never the mistake itself, nor anything else the student just saw.
        [...attemptQuestionIds, ...rows.map((r) => r.questionId)],
      ],
    );
    const items = rows
      .map((row) => ({
        row,
        candidates: pool
          .filter((q) => q.topic_id === row.topicId)
          .slice(0, MAX_CANDIDATES),
      }))
      .filter((item) => item.candidates.length);
    const result = new Map<number, number>();
    if (!items.length) return result;
    const { matches } = await this.llm.chatJson({
      purpose: "confirmation-same-skill",
      system: SAME_SKILL_MATCH_SYSTEM,
      messages: [
        {
          role: "user",
          content: sameSkillMatchMessage(
            items.map(({ row, candidates }, index) => ({
              index,
              prompt: row.prompt,
              correctAnswer: row.correctAnswer,
              studentAnswer: row.answer,
              misconception:
                misconceptions.get(row.answerId) ??
                row.mistakeExplanation ??
                (row.answer
                  ? (row.optionMisconceptions?.[row.answer] ?? null)
                  : null),
              candidates,
            })),
          ),
        },
      ],
      schema: SameSkillMatches,
      effort: "medium",
      maxTokens: 2_000,
    });
    for (const { index, candidate_id } of matches) {
      const item = items[index];
      if (
        item &&
        candidate_id !== null &&
        item.candidates.some((c) => c.id === candidate_id)
      ) {
        result.set(item.row.questionId, candidate_id);
      }
    }
    return result;
  }

  /** Caches a pool question (already approved and self-checked) as the confirmation question. */
  private async copyAsVariant(
    poolId: number,
    originalId: number,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO questions (topic_id, type, prompt, options, correct_answer, hint, hints, explanation,
                              option_misconceptions, difficulty, source_chunk_id, generated_by_ai, status, variant_of_id)
       SELECT topic_id, type, prompt, options, correct_answer, hint, hints, explanation,
              option_misconceptions, difficulty, source_chunk_id, generated_by_ai, 'draft', $2
         FROM questions WHERE id = $1`,
      [poolId, originalId],
    );
    this.logger.log(
      `confirmation question for ${originalId}: pool question ${poolId} tests the same skill`,
    );
  }
}
