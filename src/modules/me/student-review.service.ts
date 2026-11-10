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
import { QuestionGenerationService } from "../learning/question-generation/question-generation.service";
import { ConfirmResultDto, MistakeDto, ReviewDto } from "./dto/review.dto";
import { AnswerRow, StudentAttemptsService } from "./student-attempts.service";

const MistakeExplanations = z.object({
  explanations: z.array(
    z.object({ index: z.number(), explanation: z.string() }),
  ),
});

const UNANSWERED = "Bu savolga javob berilmagan.";

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

  constructor(
    private readonly dataSource: DataSource,
    private readonly attempts: StudentAttemptsService,
    private readonly generation: QuestionGenerationService,
    private readonly llm: LlmService,
  ) {}

  async review(attemptId: number, user: AuthUser): Promise<ReviewDto> {
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
    const variants = await this.ensureVariants(
      wrong.map((w) => w.row),
      rows.map((r) => r.questionId),
    );
    const mistakes: MistakeDto[] = wrong.map(({ row, position }) => {
      const variant = variants.get(row.questionId);
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
        page: row.page,
        fixed: row.fixedAt !== null,
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
    return {
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      scorePercent: Number(attempt.score_percent ?? 0),
      totalMistakes: mistakes.length,
      fixedCount: mistakes.filter((m) => m.fixed).length,
      mistakes,
    };
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
    const variant = (
      await this.ensureVariants(
        [row],
        rows.map((r) => r.questionId),
      )
    ).get(questionId);
    if (!variant) {
      throw new ConflictException(
        "No confirmation question for this mistake yet; open the review again in a moment",
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

  /** Cached confirmation question per original question; generates the missing ones once. */
  private async ensureVariants(
    rows: AnswerRow[],
    attemptQuestionIds: number[],
  ): Promise<Map<number, VariantRow>> {
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
    const missing = rows.filter((r) => !variants.has(r.questionId));
    if (missing.length) {
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
      } catch (error) {
        if (!(error instanceof AiUnavailableException)) throw error;
        this.logger.warn(
          `confirmation questions unavailable: ${error.message}`,
        );
      }
      const stillMissing = rows.filter((r) => !variants.has(r.questionId));
      for (const row of stillMissing) {
        await this.fallbackVariant(row, attemptQuestionIds);
      }
      if (stillMissing.length) variants = await load();
    }
    return variants;
  }

  /**
   * When no new variant passes the checks, copy an approved (already self-checked) pool question
   * of the same topic, type and difficulty that was not in this attempt, and cache it as the
   * confirmation question, so every mistake gets one and nothing is regenerated on each review.
   */
  private async fallbackVariant(
    row: AnswerRow,
    attemptQuestionIds: number[],
  ): Promise<void> {
    const [pick] = await this.dataSource.query(
      `SELECT id FROM questions
        WHERE topic_id = $1 AND type = $2 AND status = 'approved' AND variant_of_id IS NULL
          AND id <> ALL($3)
        ORDER BY (difficulty IS NOT DISTINCT FROM $4) DESC, random()
        LIMIT 1`,
      [row.topicId, row.type, attemptQuestionIds, row.difficulty],
    );
    if (!pick) return;
    await this.dataSource.query(
      `INSERT INTO questions (topic_id, type, prompt, options, correct_answer, hint, hints, explanation,
                              option_misconceptions, difficulty, source_chunk_id, generated_by_ai, status, variant_of_id)
       SELECT topic_id, type, prompt, options, correct_answer, hint, hints, explanation,
              option_misconceptions, difficulty, source_chunk_id, generated_by_ai, 'draft', $2
         FROM questions WHERE id = $1`,
      [pick.id, row.questionId],
    );
    this.logger.log(
      `confirmation question for ${row.questionId}: copied pool question ${pick.id}`,
    );
  }
}
