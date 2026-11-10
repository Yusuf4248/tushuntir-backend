import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import * as z from "zod";
import { AuthUser } from "../../common/auth/auth-user";
import { LlmService } from "../ai/llm.service";
import {
  StudyChatAction,
  studyChatSystem,
  studyChatUserMessage,
} from "../ai/prompts/study-chat.prompt";
import { RetrievalService } from "../ai/retrieval.service";
import { normalizeAnswer } from "../learning/questions/answer-match";
import {
  ChatExchangeDto,
  ChatSessionDto,
  ChatTurnDto,
  WeakTopicDto,
} from "./dto/chat.dto";
import { MasteryStatus } from "./me.types";
import { StudentScheduleService } from "./student-schedule.service";

const SESSION_KIND = "study";
const HISTORY_MESSAGES = 12;

const ChatAnswer = z.object({
  answer: z.string(),
  used_fragment_ids: z.array(z.number()),
  covered: z.boolean(),
  on_topic: z.boolean(),
  language: z.enum(["uz", "ru"]),
});

const OPEN_QUIZ_REPLY =
  "Bu savol hozir ishlayotgan testingizda bor, shuning uchun javobini aytmayman. " +
  "Testni topshirganingizdan keyin qoidani birga ko'rib chiqamiz yoki boshqa misol bilan tushuntiraman.";

interface SessionRow {
  id: number;
  topic_id: number;
  title: string;
  started_at: Date;
}

/**
 * Self-study chat grounded in the topic's textbook text. The whole topic goes into the prompt
 * (topics are small); RetrievalService.search can replace chunksForTopic for larger books.
 */
@Injectable()
export class StudentChatService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly llm: LlmService,
    private readonly retrieval: RetrievalService,
    private readonly schedule: StudentScheduleService,
  ) {}

  async createSession(
    topicId: number,
    user: AuthUser,
  ): Promise<ChatSessionDto> {
    const [topic] = await this.dataSource.query(
      `SELECT topic.id, topic.title, textbook.subject_id
         FROM topics topic
         JOIN chapters chapter ON chapter.id = topic.chapter_id
         JOIN textbooks textbook ON textbook.id = chapter.textbook_id
        WHERE topic.id = $1`,
      [topicId],
    );
    if (!topic) throw new NotFoundException(`Topic ${topicId} not found`);
    const [{ id, started_at }] = await this.dataSource.query(
      `INSERT INTO ai_sessions (student_id, subject_id, topic_id, kind) VALUES ($1, $2, $3, $4)
       RETURNING id, started_at`,
      [user.id, topic.subject_id, topic.id, SESSION_KIND],
    );
    return {
      sessionId: id,
      topicId: topic.id,
      topicTitle: topic.title,
      startedAt: started_at,
      messages: [],
    };
  }

  async session(sessionId: number, user: AuthUser): Promise<ChatSessionDto> {
    const session = await this.ownSession(sessionId, user);
    return {
      sessionId: session.id,
      topicId: session.topic_id,
      topicTitle: session.title,
      startedAt: session.started_at,
      messages: await this.messages(session.id),
    };
  }

  async send(
    sessionId: number,
    input: { text?: string; selectedText?: string; action?: StudyChatAction },
    user: AuthUser,
  ): Promise<ChatExchangeDto> {
    const text = input.text?.trim() || null;
    const selectedText = input.selectedText?.trim() || null;
    const action = input.action ?? null;
    if (!text && !action) {
      throw new BadRequestException("Send text, an action, or both");
    }
    const session = await this.ownSession(sessionId, user);
    const openQuizQuestions = await this.openQuizQuestions(user.id);
    const studentContent = [
      selectedText ? `> ${selectedText}` : null,
      text ?? `(${action})`,
    ]
      .filter(Boolean)
      .join("\n\n");

    // A question copied from the student's open quiz is refused without calling the AI.
    if (text && this.matchesOpenQuiz(text, openQuizQuestions)) {
      return this.save(session.id, studentContent, {
        answer: OPEN_QUIZ_REPLY,
        sources: [],
        covered: true,
        onTopic: true,
        language: "uz",
        refused: "open_quiz",
      });
    }

    const chunks = await this.retrieval.chunksForTopic(session.topic_id);
    const history = await this.messages(session.id, HISTORY_MESSAGES);
    const reply = await this.llm.chatJson({
      purpose: `study-chat${action ? `:${action}` : ""}`,
      system: studyChatSystem({
        topicTitle: session.title,
        chunks,
        openQuizQuestions,
      }),
      messages: [
        ...history.map((m) => ({
          role:
            m.role === "student" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
        {
          role: "user",
          content: studyChatUserMessage({ text, selectedText, action }),
        },
      ],
      schema: ChatAnswer,
      effort: "low",
      maxTokens: 3_000,
    });
    const used = new Set(reply.used_fragment_ids);
    const sources = reply.covered
      ? chunks
          .filter((chunk) => used.has(chunk.id))
          .map((chunk) => ({ page: chunk.page, chunkId: chunk.id }))
      : [];
    return this.save(session.id, studentContent, {
      answer: reply.answer.trim(),
      sources,
      covered: reply.covered,
      onTopic: reply.on_topic,
      language: reply.language,
      refused: null,
    });
  }

  /** Topics that need practice, with what went wrong in the student's unfixed mistakes there. */
  async weakTopics(user: AuthUser): Promise<WeakTopicDto[]> {
    const weak = (await this.schedule.mastery(user.id)).topics.filter(
      (t) =>
        t.status === MasteryStatus.NEEDS_PRACTICE ||
        t.status === MasteryStatus.NEEDS_HELP,
    );
    if (!weak.length) return [];
    const rows: {
      topic_id: number;
      answer: string | null;
      mistake_explanation: string | null;
      option_misconceptions: Record<string, string> | null;
    }[] = await this.dataSource.query(
      `SELECT question.topic_id, answer.answer, answer.mistake_explanation, question.option_misconceptions
         FROM attempt_answers answer
         JOIN attempts attempt ON attempt.id = answer.attempt_id
         JOIN questions question ON question.id = answer.question_id
        WHERE attempt.student_id = $1 AND attempt.finished_at IS NOT NULL
          AND answer.is_correct IS NOT TRUE AND answer.fixed_at IS NULL
          AND question.topic_id = ANY($2)
        ORDER BY attempt.finished_at DESC, answer.id`,
      [user.id, weak.map((t) => t.topicId)],
    );
    return weak.map((topic) => {
      const mine = rows.filter((r) => r.topic_id === topic.topicId);
      const skills = mine
        .map(
          (r) =>
            r.mistake_explanation ??
            (r.answer ? r.option_misconceptions?.[r.answer] : undefined),
        )
        .filter((s): s is string => Boolean(s));
      return {
        topicId: topic.topicId,
        title: topic.title,
        subject: topic.subject,
        status: topic.status,
        homeScore: topic.homeScore,
        subSkills: [...new Set(skills)].slice(0, 5),
        openMistakes: mine.length,
      };
    });
  }

  private async save(
    sessionId: number,
    studentContent: string,
    reply: Omit<
      ChatExchangeDto["reply"],
      "id" | "role" | "content" | "createdAt"
    > & {
      answer: string;
    },
  ): Promise<ChatExchangeDto> {
    return this.dataSource.transaction(async (manager) => {
      const insert = async (
        role: string,
        content: string,
      ): Promise<ChatTurnDto> => {
        const [row] = await manager.query(
          `INSERT INTO ai_messages (session_id, role, content) VALUES ($1, $2, $3)
           RETURNING id, role, content, created_at AS "createdAt"`,
          [sessionId, role, content],
        );
        return row;
      };
      const message = await insert("student", studentContent);
      const answer = await insert("assistant", reply.answer);
      const { sources, covered, onTopic, language, refused } = reply;
      return {
        sessionId,
        message,
        reply: { ...answer, sources, covered, onTopic, language, refused },
      };
    });
  }

  private async ownSession(
    sessionId: number,
    user: AuthUser,
  ): Promise<SessionRow> {
    const [session] = await this.dataSource.query(
      `SELECT session.id, session.topic_id, topic.title, session.started_at
         FROM ai_sessions session JOIN topics topic ON topic.id = session.topic_id
        WHERE session.id = $1 AND session.student_id = $2 AND session.kind = $3`,
      [sessionId, user.id, SESSION_KIND],
    );
    if (!session)
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    return session;
  }

  private async messages(
    sessionId: number,
    last?: number,
  ): Promise<ChatTurnDto[]> {
    const rows: ChatTurnDto[] = await this.dataSource.query(
      `SELECT id, role, content, created_at AS "createdAt" FROM ai_messages
        WHERE session_id = $1 ORDER BY id DESC ${last ? `LIMIT ${last}` : ""}`,
      [sessionId],
    );
    return rows.reverse();
  }

  /** Prompts of questions in the student's unsubmitted, still-open quiz attempts. */
  private async openQuizQuestions(studentId: number): Promise<string[]> {
    const rows: { prompt: string }[] = await this.dataSource.query(
      `SELECT DISTINCT question.prompt
         FROM attempts attempt
         JOIN attempt_answers answer ON answer.attempt_id = attempt.id
         JOIN questions question ON question.id = answer.question_id
        WHERE attempt.student_id = $1 AND attempt.mode = 'home' AND attempt.finished_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM homework WHERE quiz_id = attempt.quiz_id AND due_at < now())`,
      [studentId],
    );
    return rows.map((r) => r.prompt);
  }

  private matchesOpenQuiz(text: string, prompts: string[]): boolean {
    const asked = normalizeAnswer(text);
    return prompts.some((prompt) => {
      const question = normalizeAnswer(prompt);
      return (
        question.length >= 12 &&
        (asked.includes(question) ||
          (asked.length >= 12 && question.includes(asked)))
      );
    });
  }
}
