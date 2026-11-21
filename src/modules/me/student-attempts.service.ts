import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import * as z from "zod";
import { AuthUser } from "../../common/auth/auth-user";
import { QuestionStatus, QuestionType } from "../../common/enums";
import { seededShuffle, shuffle } from "../../common/shuffle";
import { AiUnavailableException } from "../ai/ai.errors";
import { LlmService } from "../ai/llm.service";
import { AppLanguage } from "../../common/i18n/language";
import {
  shortAnswerCheckMessage,
  shortAnswerCheckSystem,
} from "../ai/prompts/short-answer-check.prompt";
import {
  answersMatch,
  normalizeAnswer,
} from "../learning/questions/answer-match";
import {
  AnswerResultDto,
  AttemptViewDto,
  HintDto,
  SubmitResultDto,
} from "./dto/me-responses.dto";
import {
  masteryStatus,
  QUESTIONS_PER_ATTEMPT,
  StudentQuizStatus,
} from "./me.types";
import { StudentScheduleService } from "./student-schedule.service";
import { StudentTranslator } from "./student-translator";

const ShortAnswerVerdict = z.object({
  is_correct: z.boolean(),
  feedback: z.string(),
});

export interface AttemptRow {
  id: number;
  quiz_id: number;
  title: string | null;
  topic_id: number | null;
  started_at: Date;
  finished_at: Date | null;
  score_percent: string | null;
  due_at: Date | null;
}

export interface AnswerRow {
  answerId: number;
  questionId: number;
  answer: string | null;
  isCorrect: boolean | null;
  hintsUsed: number | null;
  aiFeedback: string | null;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctAnswer: string;
  hint: string | null;
  hints: string[] | null;
  explanation: string | null;
  optionMisconceptions: Record<string, string> | null;
  topicId: number;
  difficulty: number | null;
  page: number | null;
  sourceChunkId: number | null;
  mistakeExplanation: string | null;
  fixedAt: Date | null;
}

/** Hint levels of a question: the three-level hints, or the single legacy hint. */
function hintLevels(row: Pick<AnswerRow, "hints" | "hint">): string[] {
  return row.hints?.length ? row.hints : row.hint ? [row.hint] : [];
}

/** Write side of the student quiz loop: start, answer, hint, submit. Students only see their own attempts. */
@Injectable()
export class StudentAttemptsService {
  private readonly logger = new Logger(StudentAttemptsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedule: StudentScheduleService,
    private readonly llm: LlmService,
    private readonly translator: StudentTranslator,
  ) {}

  /** Creates the attempt with a random set of approved questions, or returns the open one. */
  async start(
    quizId: number,
    user: AuthUser,
    language: AppLanguage = "uz",
  ): Promise<AttemptViewDto> {
    const quiz = (await this.schedule.quizzesOf(user.id)).find(
      (q) => q.quizId === quizId,
    );
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} not found`);
    if (quiz.status === StudentQuizStatus.DONE) {
      throw new ConflictException(
        "You have already submitted this quiz; it can be taken once",
      );
    }
    if (quiz.status === StudentQuizStatus.LOCKED) {
      throw new ConflictException(
        `This quiz opens when the lesson ends (${quiz.unlocksAt.toISOString()})`,
      );
    }
    if (quiz.status === StudentQuizStatus.OVERDUE) {
      throw new ConflictException("The deadline for this quiz has passed");
    }
    if (!quiz.topic) {
      throw new ConflictException(
        "This quiz has no topic to take questions from",
      );
    }
    const topicId = quiz.topic.id;

    const attemptId = await this.dataSource.transaction(async (manager) => {
      // One attempt per student and quiz, even if "start" is pressed twice at once.
      await manager.query(`SELECT pg_advisory_xact_lock($1, $2)`, [
        quizId,
        user.id,
      ]);
      const [open] = await manager.query(
        `SELECT id FROM attempts WHERE quiz_id = $1 AND student_id = $2 AND mode = 'home' ORDER BY id DESC LIMIT 1`,
        [quizId, user.id],
      );
      if (open) return open.id as number;
      const pool: { id: number }[] = await manager.query(
        `SELECT id FROM questions WHERE topic_id = $1 AND status = $2 AND variant_of_id IS NULL`,
        [topicId, QuestionStatus.APPROVED],
      );
      if (!pool.length) {
        throw new ConflictException(
          "This quiz has no approved questions yet; ask your teacher",
        );
      }
      const picked = shuffle(pool).slice(0, QUESTIONS_PER_ATTEMPT);
      const [{ id }] = await manager.query(
        `INSERT INTO attempts (quiz_id, student_id, mode, started_at) VALUES ($1, $2, 'home', now()) RETURNING id`,
        [quizId, user.id],
      );
      for (const question of picked) {
        await manager.query(
          `INSERT INTO attempt_answers (attempt_id, question_id, hints_used) VALUES ($1, $2, 0)`,
          [id, question.id],
        );
      }
      return id as number;
    });
    return this.view(attemptId, user, language);
  }

  async answer(
    attemptId: number,
    questionId: number,
    answer: string,
    user: AuthUser,
    language: AppLanguage = "uz",
  ): Promise<AnswerResultDto> {
    const attempt = await this.openAttempt(attemptId, user);
    const rows = await this.answers(this.dataSource.manager, attempt.id);
    const row = rows.find((r) => r.questionId === questionId);
    if (!row) {
      throw new NotFoundException(
        `Question ${questionId} is not part of attempt ${attemptId}`,
      );
    }
    let given = answer.trim();
    let isCorrect: boolean;
    let feedback: string | null = null;
    if (row.type === QuestionType.MULTIPLE_CHOICE) {
      // A translated option is mapped back to the original; the original is stored and graded.
      const original = await this.translator.originalOption(
        row.options ?? [],
        given,
        language,
      );
      if (original === null) {
        throw new BadRequestException("answer must be one of the options");
      }
      given = original;
      isCorrect = given === row.correctAnswer.trim();
    } else {
      ({ isCorrect, feedback } = await this.checkShortAnswer(
        row,
        given,
        language,
      ));
    }
    await this.dataSource.query(
      `UPDATE attempt_answers SET answer = $1, is_correct = $2, ai_feedback = $3 WHERE id = $4`,
      [given, isCorrect, feedback, row.answerId],
    );
    return {
      questionId,
      answer: answer.trim(),
      answeredCount: rows.filter(
        (r) => r.answer !== null || r.questionId === questionId,
      ).length,
      totalQuestions: rows.length,
    };
  }

  /** Next hint level (1 → 2 → 3); never the answer. A wrong saved option also gets its misconception. */
  async hint(
    attemptId: number,
    questionId: number,
    user: AuthUser,
    language: AppLanguage = "uz",
  ): Promise<HintDto> {
    const attempt = await this.openAttempt(attemptId, user);
    const row = (await this.answers(this.dataSource.manager, attempt.id)).find(
      (r) => r.questionId === questionId,
    );
    if (!row) {
      throw new NotFoundException(
        `Question ${questionId} is not part of attempt ${attemptId}`,
      );
    }
    const levels = hintLevels(row);
    if (!levels.length) {
      throw new ConflictException("This question has no hints");
    }
    const level = Math.min((row.hintsUsed ?? 0) + 1, levels.length);
    if (level !== row.hintsUsed) {
      await this.dataSource.query(
        `UPDATE attempt_answers SET hints_used = $1 WHERE id = $2`,
        [level, row.answerId],
      );
    }
    let misconception: string | null = null;
    if (
      row.type === QuestionType.MULTIPLE_CHOICE &&
      row.answer !== null &&
      row.isCorrect === false
    ) {
      misconception = row.optionMisconceptions?.[row.answer] ?? null;
      // Generated text is checked for leaks at creation; check again before showing it.
      const key = normalizeAnswer(row.correctAnswer);
      if (
        misconception &&
        key.length >= 3 &&
        normalizeAnswer(misconception).includes(key)
      ) {
        misconception = null;
      }
    }
    const result: HintDto = {
      questionId,
      level,
      hint: levels[level - 1],
      misconception,
      hintsUsed: level,
      hintsRemaining: levels.length - level,
    };
    await this.translator
      .batch(language)
      .text(result.hint, (t) => (result.hint = t))
      .text(result.misconception, (t) => (result.misconception = t))
      .run();
    return result;
  }

  /** Scores the attempt, records points and updates topic mastery. Submitting twice returns the same result. */
  async submit(
    attemptId: number,
    user: AuthUser,
    language: AppLanguage = "uz",
  ): Promise<SubmitResultDto> {
    const attempt = await this.ownAttempt(attemptId, user);
    if (!attempt.finished_at) {
      this.assertBeforeDeadline(attempt);
      await this.dataSource.transaction(async (manager) => {
        const rows = await this.answers(manager, attempt.id);
        const correct = rows.filter((r) => r.isCorrect === true).length;
        const score = rows.length
          ? Math.round((correct / rows.length) * 10000) / 100
          : 0;
        await manager.query(
          `UPDATE attempt_answers SET points_earned = CASE WHEN is_correct THEN 1 ELSE 0 END WHERE attempt_id = $1`,
          [attempt.id],
        );
        const [, updated]: [unknown[], number] = await manager.query(
          `UPDATE attempts SET score_percent = $1, finished_at = now() WHERE id = $2 AND finished_at IS NULL`,
          [score, attempt.id],
        );
        if (updated && attempt.topic_id) {
          await manager.query(
            `INSERT INTO topic_mastery (student_id, topic_id, mastery, home_score, updated_at)
             VALUES ($1, $2, $3, $4, now())
             ON CONFLICT (student_id, topic_id)
             DO UPDATE SET mastery = EXCLUDED.mastery, home_score = EXCLUDED.home_score, updated_at = now()`,
            [user.id, attempt.topic_id, Math.round(score), score],
          );
        }
      });
    }
    return this.result(attemptId, user, language);
  }

  private async result(
    attemptId: number,
    user: AuthUser,
    language: AppLanguage,
  ): Promise<SubmitResultDto> {
    const attempt = await this.ownAttempt(attemptId, user);
    const rows = await this.answers(this.dataSource.manager, attempt.id);
    const [progress] = attempt.topic_id
      ? await this.dataSource.query(
          `SELECT is_mastered, home_score FROM topic_mastery WHERE student_id = $1 AND topic_id = $2`,
          [user.id, attempt.topic_id],
        )
      : [];
    const result: SubmitResultDto = {
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      scorePercent: Number(attempt.score_percent ?? 0),
      correctCount: rows.filter((r) => r.isCorrect === true).length,
      totalQuestions: rows.length,
      hintsUsed: rows.reduce((sum, r) => sum + (r.hintsUsed ?? 0), 0),
      finishedAt: attempt.finished_at!,
      questions: rows.map((r, i) => ({
        questionId: r.questionId,
        position: i + 1,
        type: r.type,
        prompt: r.prompt,
        options: this.optionsFor(r),
        yourAnswer: r.answer,
        isCorrect: r.isCorrect === true,
        correctAnswer: r.correctAnswer,
        explanation: r.explanation,
        hintsUsed: r.hintsUsed ?? 0,
        aiFeedback: r.aiFeedback,
      })),
      mastery:
        attempt.topic_id && progress
          ? {
              topicId: attempt.topic_id,
              status: await this.schedule.topicStatus(
                user.id,
                attempt.topic_id,
              ),
              homeScore: Number(progress.home_score),
            }
          : null,
    };
    const batch = this.translator.batch(language);
    for (const q of result.questions) {
      batch
        .text(q.prompt, (t) => (q.prompt = t))
        .options(q.options, (o) => (q.options = o))
        .text(q.explanation, (t) => (q.explanation = t));
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        batch
          .text(q.yourAnswer, (t) => (q.yourAnswer = t))
          .text(q.correctAnswer, (t) => (q.correctAnswer = t));
      }
    }
    await batch.run();
    return result;
  }

  async view(
    attemptId: number,
    user: AuthUser,
    language: AppLanguage = "uz",
  ): Promise<AttemptViewDto> {
    const attempt = await this.ownAttempt(attemptId, user);
    const rows = await this.answers(this.dataSource.manager, attempt.id);
    const view: AttemptViewDto = {
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      title: attempt.title,
      dueAt: attempt.due_at,
      startedAt: attempt.started_at,
      questions: rows.map((r, i) => ({
        questionId: r.questionId,
        position: i + 1,
        type: r.type,
        prompt: r.prompt,
        options: this.optionsFor(r),
        answer: r.answer,
        hintsUsed: r.hintsUsed ?? 0,
        hintsAvailable: hintLevels(r).length,
        hints: hintLevels(r).slice(0, r.hintsUsed ?? 0),
      })),
    };
    // Other languages: question, options and revealed hints translated; answers stay originals
    // internally, so the saved answer is shown in the same language as its options.
    const batch = this.translator.batch(language);
    for (const q of view.questions) {
      batch
        .text(q.prompt, (t) => (q.prompt = t))
        .options(q.options, (o) => (q.options = o));
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        batch.text(q.answer, (t) => (q.answer = t));
      }
      q.hints.forEach((hint, i) => batch.text(hint, (t) => (q.hints[i] = t)));
    }
    await batch.run();
    return view;
  }

  /** Option order is shuffled per attempt answer, so it differs between students but stays stable. */
  optionsFor(row: Pick<AnswerRow, "options" | "answerId">): string[] | null {
    return row.options ? seededShuffle(row.options, row.answerId) : null;
  }

  /** Normalized match first; the AI decides only when that fails. If the AI is down, the match result stands. */
  async checkShortAnswer(
    row: Pick<AnswerRow, "prompt" | "correctAnswer" | "questionId">,
    given: string,
    language: AppLanguage = "uz",
  ): Promise<{ isCorrect: boolean; feedback: string | null }> {
    if (answersMatch(given, row.correctAnswer)) {
      return { isCorrect: true, feedback: null };
    }
    try {
      const verdict = await this.llm.chatJson({
        purpose: "short-answer-check",
        system: shortAnswerCheckSystem(language),
        messages: [
          {
            role: "user",
            content: shortAnswerCheckMessage({
              prompt: row.prompt,
              answerKey: row.correctAnswer,
              studentAnswer: given,
            }),
          },
        ],
        schema: ShortAnswerVerdict,
        effort: "low",
        maxTokens: 2_000,
        timeoutMs: 20_000,
      });
      return {
        isCorrect: verdict.is_correct,
        feedback: verdict.feedback.trim() || null,
      };
    } catch (error) {
      if (!(error instanceof AiUnavailableException)) throw error;
      this.logger.warn(
        `short answer for question ${row.questionId} checked without AI: ${error.message}`,
      );
      return { isCorrect: false, feedback: null };
    }
  }

  async ownAttempt(attemptId: number, user: AuthUser): Promise<AttemptRow> {
    const [attempt]: AttemptRow[] = await this.dataSource.query(
      `SELECT attempt.id, attempt.quiz_id, quiz.title, quiz.topic_id, attempt.started_at,
              attempt.finished_at, attempt.score_percent,
              (SELECT min(due_at) FROM homework WHERE quiz_id = attempt.quiz_id) AS due_at
         FROM attempts attempt
         JOIN quizzes quiz ON quiz.id = attempt.quiz_id
        WHERE attempt.id = $1 AND attempt.student_id = $2 AND attempt.mode = 'home'`,
      [attemptId, user.id],
    );
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    return attempt;
  }

  private async openAttempt(
    attemptId: number,
    user: AuthUser,
  ): Promise<AttemptRow> {
    const attempt = await this.ownAttempt(attemptId, user);
    if (attempt.finished_at) {
      throw new ConflictException("This attempt has already been submitted");
    }
    this.assertBeforeDeadline(attempt);
    return attempt;
  }

  private assertBeforeDeadline(attempt: AttemptRow): void {
    if (attempt.due_at && Date.now() > attempt.due_at.getTime()) {
      throw new ConflictException("The deadline for this quiz has passed");
    }
  }

  answers(manager: EntityManager, attemptId: number): Promise<AnswerRow[]> {
    return manager.query(
      `SELECT answer.id AS "answerId", answer.question_id AS "questionId", answer.answer,
              answer.is_correct AS "isCorrect", answer.hints_used AS "hintsUsed",
              answer.ai_feedback AS "aiFeedback",
              question.type, question.prompt, question.options,
              question.correct_answer AS "correctAnswer", question.hint, question.hints,
              question.explanation, question.option_misconceptions AS "optionMisconceptions",
              question.topic_id AS "topicId", question.difficulty, chunk.page,
              question.source_chunk_id AS "sourceChunkId",
              answer.mistake_explanation AS "mistakeExplanation", answer.fixed_at AS "fixedAt"
         FROM attempt_answers answer
         JOIN questions question ON question.id = answer.question_id
         LEFT JOIN textbook_chunks chunk ON chunk.id = question.source_chunk_id
        WHERE answer.attempt_id = $1
        ORDER BY answer.id`,
      [attemptId],
    );
  }
}
