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
import { LlmService } from "../ai/llm.service";
import {
  CHECKPOINT_JUDGE_SYSTEM,
  CHECKPOINT_OPENING_SYSTEM,
  checkpointJudgeMessage,
  checkpointOpeningMessage,
} from "../ai/prompts/checkpoint.prompt";
import { RetrievalService } from "../ai/retrieval.service";
import { AudioInput, SttService } from "../ai/speech/stt.service";
import { TtsService } from "../ai/speech/tts.service";
import {
  CheckpointAnswerResultDto,
  CheckpointDto,
  CheckpointOutcome,
  CheckpointStage,
  CheckpointStatusDto,
  NextTopicDto,
  SardorLineDto,
} from "./dto/checkpoint.dto";
import {
  CHECKPOINT_PASS_SHARE,
  CheckpointResult,
  MasteryStatus,
  NEEDS_HELP_AFTER_TRIES,
} from "./me.types";
import {
  StudentScheduleService,
  StudentTopic,
} from "./student-schedule.service";

const SPEAKER = "Sardor";

/** General maths words in Uzbek: they steer recognition without hinting at the right answer. */
const STT_VOCABULARY =
  "ifoda, birhad, ko'phad, koeffitsiyent, daraja, kvadrat, tenglama, ildiz, qavs, ishora, yig'indi, ayirma, ko'paytma, o'xshash hadlar";

const FALLBACK_FOLLOW_UP =
  "Hali to'liq tushunmadim. Yana bitta misol bilan tushuntirib bera olasanmi?";
const FALLBACK_NEXT_QUESTION =
  "Keling, yana bir marta urinib ko'ramiz. Shu mavzuni menga boshidan sodda qilib tushuntirib bera olasanmi?";
const FALLBACK_PRAISE = "Rahmat, endi tushundim!";

const Opening = z.object({ line: z.string() });

const Judgement = z.object({
  covered: z.array(z.number()),
  wrong_statements: z.array(z.string()),
  praise: z.string(),
  follow_up: z.string(),
  explanation: z.string(),
  next_question: z.string(),
});

interface CheckpointRow {
  id: number;
  topic_id: number;
  try_number: number;
  mode: "voice" | "text" | null;
  prompt: string;
  transcript: string | null;
  follow_up: string | null;
  result: CheckpointResult | null;
  created_at: Date;
}

/** Speech-to-text output, cleaned: one apostrophe style, single spaces. */
function cleanTranscript(text: string): string {
  return text
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "Tushuntir" checkpoint: the AI classmate Sardor states a misconception and the student
 * explains the topic to him by voice or text. The explanation is judged against
 * topics.key_ideas by meaning; passing sets topic_mastery.is_mastered.
 */
@Injectable()
export class StudentCheckpointService {
  private readonly logger = new Logger(StudentCheckpointService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly llm: LlmService,
    private readonly retrieval: RetrievalService,
    private readonly stt: SttService,
    private readonly tts: TtsService,
    private readonly schedule: StudentScheduleService,
  ) {}

  /** Opens a new try, or returns the open one. */
  async start(topicId: number, user: AuthUser): Promise<CheckpointDto> {
    const topic = await this.checkpointTopic(topicId, user);
    const [open]: CheckpointRow[] = await this.dataSource.query(
      `SELECT * FROM checkpoint_attempts
        WHERE student_id = $1 AND topic_id = $2 AND result IS NULL
        ORDER BY id DESC LIMIT 1`,
      [user.id, topic.id],
    );
    if (open) return this.view(open, topic);
    const prompt = await this.opening(topic, user);
    const row = await this.insertTry(
      this.dataSource.manager,
      topic.id,
      user.id,
      prompt,
    );
    return this.view(row, topic);
  }

  async answer(
    checkpointId: number,
    input: { text?: string; audio?: AudioInput },
    user: AuthUser,
  ): Promise<CheckpointAnswerResultDto> {
    const [row]: CheckpointRow[] = await this.dataSource.query(
      `SELECT * FROM checkpoint_attempts WHERE id = $1 AND student_id = $2`,
      [checkpointId, user.id],
    );
    if (!row)
      throw new NotFoundException(`Checkpoint ${checkpointId} not found`);
    if (row.result) {
      throw new ConflictException(
        "This try is already judged; start the next one",
      );
    }
    const typed = input.text?.trim();
    if (Boolean(typed) === Boolean(input.audio)) {
      throw new BadRequestException(
        "Send either text or an audio file (field name: audio)",
      );
    }
    const topic = await this.checkpointTopic(row.topic_id, user);
    const keyIdeas = topic.key_ideas!;

    const sttStarted = Date.now();
    const answer = input.audio
      ? cleanTranscript(
          await this.stt.transcribe(input.audio, {
            prompt: `O'zbek tilida matematika darsi. Mavzu: ${topic.title}. ${STT_VOCABULARY}.`,
          }),
        )
      : typed!;
    const sttMs = input.audio ? Date.now() - sttStarted : 0;
    if (!answer) {
      throw new BadRequestException(
        "No speech was recognised; record again or send text",
      );
    }
    const mode = input.audio || row.mode === "voice" ? "voice" : "text";
    const stage = row.follow_up === null ? "first" : "final";

    const judgeStarted = Date.now();
    const judgement = await this.llm.chatJson({
      purpose: `checkpoint-judge:${stage}`,
      system: CHECKPOINT_JUDGE_SYSTEM,
      messages: [
        {
          role: "user",
          content: checkpointJudgeMessage({
            topicTitle: topic.title,
            keyIdeas,
            opening: row.prompt,
            explanation: stage === "first" ? answer : row.transcript!,
            followUp: row.follow_up,
            followUpAnswer: stage === "final" ? answer : null,
            stage,
          }),
        },
      ],
      schema: Judgement,
      effort: "medium",
      maxTokens: 3_000,
    });
    const judgeMs = Date.now() - judgeStarted;

    const covered = new Set(judgement.covered);
    const matchedIdeas = keyIdeas.filter((_, i) => covered.has(i + 1));
    const missingIdeas = keyIdeas.filter((_, i) => !covered.has(i + 1));
    const wrongStatements = judgement.wrong_statements
      .map((s) => s.trim())
      .filter(Boolean);
    const passed =
      matchedIdeas.length >=
        Math.ceil(keyIdeas.length * CHECKPOINT_PASS_SHARE) &&
      wrongStatements.length === 0;
    this.logger.log(
      `checkpoint ${row.id} try=${row.try_number} stage=${stage} mode=${input.audio ? "voice" : "text"} ` +
        `stt_ms=${sttMs} judge_ms=${judgeMs} covered=${matchedIdeas.length}/${keyIdeas.length} ` +
        `wrong=${wrongStatements.length} passed=${passed}`,
    );
    const base = {
      checkpointId: row.id,
      tryNumber: row.try_number,
      mode,
      transcript: answer,
      matchedIdeas,
      missingIdeas,
      wrongStatements,
    } as const;

    // Key ideas missing on the first answer: Sardor asks one follow-up question.
    if (!passed && stage === "first") {
      const followUp = judgement.follow_up.trim() || FALLBACK_FOLLOW_UP;
      const saved = await this.dataSource.query(
        `UPDATE checkpoint_attempts
            SET mode = $2, transcript = $3, follow_up = $4,
                matched_ideas = $5, missing_ideas = $6, wrong_statements = $7
          WHERE id = $1 AND result IS NULL AND follow_up IS NULL
          RETURNING id`,
        [
          row.id,
          mode,
          answer,
          followUp,
          JSON.stringify(matchedIdeas),
          JSON.stringify(missingIdeas),
          JSON.stringify(wrongStatements),
        ],
      );
      if (!saved[0]?.length) this.alreadyAnswered();
      return {
        ...base,
        outcome: CheckpointOutcome.FOLLOW_UP,
        followUp: await this.line(followUp),
        feedback: null,
        next: null,
        masteryStatus: await this.schedule.topicStatus(user.id, topic.id),
        teacherNotified: false,
        nextTopic: null,
      };
    }

    const result = passed ? CheckpointResult.PASSED : CheckpointResult.NOT_YET;
    const feedback = passed
      ? judgement.praise.trim() || FALLBACK_PRAISE
      : judgement.explanation.trim() || null;
    const { nextRow, teacherNotified } = await this.dataSource.transaction(
      async (manager) => {
        const answerColumn =
          stage === "first" ? "transcript" : "follow_up_transcript";
        const saved = await manager.query(
          `UPDATE checkpoint_attempts
              SET mode = $2, ${answerColumn} = $3, result = $4, matched_ideas = $5,
                  missing_ideas = $6, wrong_statements = $7, feedback = $8, judged_at = now()
            WHERE id = $1 AND result IS NULL
            RETURNING id`,
          [
            row.id,
            mode,
            answer,
            result,
            JSON.stringify(matchedIdeas),
            JSON.stringify(missingIdeas),
            JSON.stringify(wrongStatements),
            feedback,
          ],
        );
        if (!saved[0]?.length) this.alreadyAnswered();
        if (passed) {
          await manager.query(
            `INSERT INTO topic_mastery (student_id, topic_id, is_mastered, updated_at)
             VALUES ($1, $2, true, now())
             ON CONFLICT (student_id, topic_id) DO UPDATE SET is_mastered = true, updated_at = now()`,
            [user.id, topic.id],
          );
          return { nextRow: null, teacherNotified: false };
        }
        const next = await this.insertTry(
          manager,
          topic.id,
          user.id,
          judgement.next_question.trim() || FALLBACK_NEXT_QUESTION,
        );
        return {
          nextRow: next,
          teacherNotified: await this.notifyIfStuck(
            manager,
            topic,
            user.id,
            missingIdeas,
          ),
        };
      },
    );
    return {
      ...base,
      outcome: passed ? CheckpointOutcome.PASSED : CheckpointOutcome.NOT_YET,
      followUp: null,
      feedback,
      next: nextRow ? await this.view(nextRow, topic) : null,
      masteryStatus: passed
        ? MasteryStatus.MASTERED
        : await this.schedule.topicStatus(user.id, topic.id),
      teacherNotified,
      nextTopic: passed ? await this.unlockedNext(topic.id) : null,
    };
  }

  /** Passing masters this topic, which unlocks the next one in the textbook. */
  private async unlockedNext(topicId: number): Promise<NextTopicDto | null> {
    const { next } = await this.schedule.neighbours(topicId);
    return next ? { ...next, unlocked: true } : null;
  }

  async status(topicId: number, user: AuthUser): Promise<CheckpointStatusDto> {
    const topic = await this.schedule.topicFor(topicId, user.id);
    if (!topic) throw new NotFoundException(`Topic ${topicId} not found`);
    const stats = (
      await this.schedule.checkpointStats(user.id, [topic.id])
    ).get(topic.id);
    const notYet = stats?.notYetSinceLastPass ?? 0;
    // topicFor and the mastery list use the same filter, so the topic is listed.
    const listed = (await this.schedule.mastery(user.id)).topics.find(
      (t) => t.topicId === topic.id,
    )!;
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      masteryStatus: listed.status,
      mastered: listed.status === MasteryStatus.MASTERED,
      unlocked: listed.unlocked,
      tries: stats?.tries ?? 0,
      lastResult: (stats?.lastResult as CheckpointResult | null) ?? null,
      lastTriedAt: stats?.lastTriedAt ?? null,
      notYetSinceLastPass: notYet,
      needsHelp: notYet >= NEEDS_HELP_AFTER_TRIES,
      openCheckpointId: stats?.openCheckpointId ?? null,
    };
  }

  private async checkpointTopic(
    topicId: number,
    user: AuthUser,
  ): Promise<StudentTopic> {
    const topic = await this.schedule.topicFor(topicId, user.id);
    if (!topic) throw new NotFoundException(`Topic ${topicId} not found`);
    if (!topic.key_ideas?.length) {
      throw new ConflictException(
        "This topic has no key ideas yet, so the checkpoint is not available",
      );
    }
    return topic;
  }

  /** Sardor's opening: the student's latest mistake in the topic, else a common one. */
  private async opening(topic: StudentTopic, user: AuthUser): Promise<string> {
    const chunks = await this.retrieval.chunksForTopic(topic.id);
    const [mistake]: {
      prompt: string;
      answer: string;
      correct_answer: string;
      misconception: string | null;
    }[] = await this.dataSource.query(
      `SELECT question.prompt, answer.answer, question.correct_answer,
              COALESCE(answer.mistake_explanation, question.option_misconceptions ->> answer.answer) AS misconception
         FROM attempt_answers answer
         JOIN attempts attempt ON attempt.id = answer.attempt_id
         JOIN questions question ON question.id = answer.question_id
        WHERE attempt.student_id = $1 AND attempt.finished_at IS NOT NULL
          AND answer.is_correct IS NOT TRUE AND answer.answer IS NOT NULL AND question.topic_id = $2
        ORDER BY (answer.fixed_at IS NULL) DESC, attempt.finished_at DESC, answer.id
        LIMIT 1`,
      [user.id, topic.id],
    );
    const earlier: { prompt: string }[] = await this.dataSource.query(
      `SELECT prompt FROM checkpoint_attempts WHERE student_id = $1 AND topic_id = $2
        ORDER BY id DESC LIMIT 5`,
      [user.id, topic.id],
    );
    const { line } = await this.llm.chatJson({
      purpose: "checkpoint-opening",
      system: CHECKPOINT_OPENING_SYSTEM,
      messages: [
        {
          role: "user",
          content: checkpointOpeningMessage({
            topicTitle: topic.title,
            keyIdeas: topic.key_ideas!,
            text: chunks.map((c) => c.content).join("\n\n"),
            mistake: mistake
              ? {
                  prompt: mistake.prompt,
                  studentAnswer: mistake.answer,
                  correctAnswer: mistake.correct_answer,
                  misconception: mistake.misconception,
                }
              : null,
            earlierOpenings: earlier.map((e) => e.prompt),
          }),
        },
      ],
      schema: Opening,
      effort: "low",
      maxTokens: 1_000,
    });
    return line.trim();
  }

  private async insertTry(
    manager: EntityManager,
    topicId: number,
    studentId: number,
    prompt: string,
  ): Promise<CheckpointRow> {
    const [row] = await manager.query(
      `INSERT INTO checkpoint_attempts (student_id, topic_id, try_number, prompt)
       SELECT $1, $2, COALESCE(max(try_number), 0) + 1, $3
         FROM checkpoint_attempts WHERE student_id = $1 AND topic_id = $2
       RETURNING *`,
      [studentId, topicId, prompt],
    );
    return row;
  }

  /**
   * On the 3rd not_yet since the last pass, the class's teacher of the subject gets a
   * needs_help notification. The student can keep trying.
   */
  private async notifyIfStuck(
    manager: EntityManager,
    topic: StudentTopic,
    studentId: number,
    missingIdeas: string[],
  ): Promise<boolean> {
    const [{ count }] = await manager.query(
      `SELECT count(*)::int AS count FROM checkpoint_attempts
        WHERE student_id = $1 AND topic_id = $2 AND result = 'not_yet'
          AND id > COALESCE((SELECT max(id) FROM checkpoint_attempts
                              WHERE student_id = $1 AND topic_id = $2 AND result = 'passed'), 0)`,
      [studentId, topic.id],
    );
    if (count !== NEEDS_HELP_AFTER_TRIES) return false;
    const [student] = await manager.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [studentId],
    );
    const name =
      [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
      `O'quvchi #${studentId}`;
    const missing = missingIdeas.length
      ? ` Oxirgi urinishda yetishmagan g'oyalar: ${missingIdeas.join(" ")}`
      : "";
    const notified = await manager.query(
      `INSERT INTO notifications (user_id, type, title, body)
       SELECT DISTINCT teacher_id, 'needs_help', $3::varchar, $4::text
         FROM teacher_assignments WHERE class_id = $1 AND subject_id = $2
       RETURNING id`,
      [
        topic.class_id,
        topic.subject_id,
        `${name}ga yordam kerak`,
        `${name} "${topic.title}" mavzusi bo'yicha Tushuntir tekshiruvidan ${NEEDS_HELP_AFTER_TRIES} marta o'ta olmadi.${missing}`,
      ],
    );
    this.logger.log(
      `checkpoint needs_help: student ${studentId}, topic ${topic.id}, ${notified.length} teacher(s) notified`,
    );
    return notified.length > 0;
  }

  private async view(
    row: CheckpointRow,
    topic: StudentTopic,
  ): Promise<CheckpointDto> {
    const [prompt, followUp] = await Promise.all([
      this.line(row.prompt),
      row.follow_up ? this.line(row.follow_up) : null,
    ]);
    return {
      checkpointId: row.id,
      topicId: topic.id,
      topicTitle: topic.title,
      tryNumber: row.try_number,
      speaker: SPEAKER,
      stage: row.follow_up
        ? CheckpointStage.FOLLOW_UP
        : CheckpointStage.OPENING,
      prompt,
      followUp,
      createdAt: row.created_at,
    };
  }

  private async line(text: string): Promise<SardorLineDto> {
    return { text, audioUrl: await this.tts.speak(text) };
  }

  private alreadyAnswered(): never {
    throw new ConflictException(
      "This try was answered at the same time; reload it",
    );
  }
}
