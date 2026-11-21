import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthUser } from "../../common/auth/auth-user";
import { AppLanguage } from "../../common/i18n/language";
import { QuestionStatus } from "../../common/enums";
import { shuffle } from "../../common/shuffle";
import { AiUnavailableException } from "../ai/ai.errors";
import { QuestionGenerationService } from "../learning/question-generation/question-generation.service";
import { AttemptViewDto } from "./dto/me-responses.dto";
import { PRACTICE_QUESTIONS } from "./me.types";
import { StudentAttemptsService } from "./student-attempts.service";
import { StudentScheduleService } from "./student-schedule.service";

interface Candidate {
  id: number;
  type: string;
  difficulty: number | null;
}

/**
 * "Yana savollar tuzib beraymi?" — a 5-question practice quiz on one topic, aimed at the
 * student's past mistakes there. Unseen approved pool questions first; new ones are generated
 * (with the usual checks and self-check) only when the pool runs out. The attempt then uses the
 * normal answer / hint / submit / review endpoints, and submit updates mastery.
 */
@Injectable()
export class StudentPracticeService {
  private readonly logger = new Logger(StudentPracticeService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedule: StudentScheduleService,
    private readonly attempts: StudentAttemptsService,
    private readonly generation: QuestionGenerationService,
  ) {}

  async start(
    topicId: number,
    user: AuthUser,
    language: AppLanguage = "uz",
  ): Promise<AttemptViewDto> {
    const topic = await this.schedule.topicFor(topicId, user.id);
    if (!topic) throw new NotFoundException(`Topic ${topicId} not found`);

    const mistakes: {
      type: string;
      difficulty: number | null;
      fixed: boolean;
    }[] = await this.dataSource.query(
      `SELECT question.type, question.difficulty, answer.fixed_at IS NOT NULL AS fixed
           FROM attempt_answers answer
           JOIN attempts attempt ON attempt.id = answer.attempt_id
           JOIN questions question ON question.id = answer.question_id
          WHERE attempt.student_id = $1 AND attempt.finished_at IS NOT NULL
            AND answer.is_correct IS NOT TRUE AND question.topic_id = $2`,
      [user.id, topicId],
    );
    const unseen: Candidate[] = await this.dataSource.query(
      `SELECT id, type, difficulty FROM questions
        WHERE topic_id = $1 AND status = $2 AND variant_of_id IS NULL
          AND id NOT IN (
            SELECT answer.question_id FROM attempt_answers answer
              JOIN attempts attempt ON attempt.id = answer.attempt_id
             WHERE attempt.student_id = $3)`,
      [topicId, QuestionStatus.APPROVED, user.id],
    );
    let picked = this.rank(unseen, mistakes).slice(0, PRACTICE_QUESTIONS);
    if (picked.length < PRACTICE_QUESTIONS) {
      picked = [
        ...picked,
        ...(await this.generateMore(
          topicId,
          PRACTICE_QUESTIONS - picked.length,
          mistakes,
        )),
      ];
    }
    if (!picked.length) {
      throw new ConflictException(
        "No practice questions are available for this topic yet",
      );
    }

    const attemptId = await this.dataSource.transaction(async (manager) => {
      const [{ id: quizId }] = await manager.query(
        `INSERT INTO quizzes (topic_id, class_id, kind, title, shuffle_questions, created_by)
         VALUES ($1, $2, 'practice', $3, true, $4) RETURNING id`,
        [topicId, topic.class_id, `${topic.title}: mashq`, user.id],
      );
      const [{ id }] = await manager.query(
        `INSERT INTO attempts (quiz_id, student_id, mode, started_at) VALUES ($1, $2, 'home', now()) RETURNING id`,
        [quizId, user.id],
      );
      for (const question of shuffle(picked)) {
        await manager.query(
          `INSERT INTO attempt_answers (attempt_id, question_id, hints_used) VALUES ($1, $2, 0)`,
          [id, question.id],
        );
      }
      return id as number;
    });
    return this.attempts.view(attemptId, user, language);
  }

  /**
   * Questions like the student's mistakes come first: same type and difficulty as an unfixed
   * mistake scores highest; ties are broken randomly.
   */
  private rank(
    candidates: Candidate[],
    mistakes: { type: string; difficulty: number | null; fixed: boolean }[],
  ): Candidate[] {
    const score = (c: Candidate) =>
      mistakes.reduce(
        (sum, m) =>
          sum +
          (m.fixed ? 1 : 2) *
            ((m.type === c.type ? 1 : 0) +
              (m.difficulty === c.difficulty ? 1 : 0)),
        0,
      );
    return shuffle(candidates)
      .map((c) => ({ c, s: score(c) }))
      .sort((a, b) => b.s - a.s)
      .map(({ c }) => c);
  }

  /** The pool ran out: generate a few at the difficulty the student struggles with most. */
  private async generateMore(
    topicId: number,
    needed: number,
    mistakes: { type: string; difficulty: number | null }[],
  ): Promise<Candidate[]> {
    const counts = new Map<number, number>();
    for (const m of mistakes) {
      counts.set(m.difficulty ?? 2, (counts.get(m.difficulty ?? 2) ?? 0) + 1);
    }
    const difficulty = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 2;
    // Ask for a couple extra: the checks may drop some.
    const total = needed + 2;
    const shortAnswer = Math.max(1, Math.round(total / 3));
    try {
      const result = await this.generation.generate(topicId, [
        { difficulty, multipleChoice: total - shortAnswer, shortAnswer },
      ]);
      this.logger.log(
        `practice for topic ${topicId}: pool ran out, generated ${result.saved} new drafts`,
      );
      return result.questions
        .slice(0, needed)
        .map((q) => ({ id: q.id, type: q.type, difficulty: q.difficulty }));
    } catch (error) {
      if (!(error instanceof AiUnavailableException)) throw error;
      this.logger.warn(`practice generation unavailable: ${error.message}`);
      return [];
    }
  }
}
