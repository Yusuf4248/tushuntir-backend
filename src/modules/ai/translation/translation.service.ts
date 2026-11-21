import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { DataSource } from "typeorm";
import * as z from "zod";
import { AppLanguage } from "../../../common/i18n/language";
import { AiUnavailableException } from "../ai.errors";
import { LlmService } from "../llm.service";
import {
  translationMessage,
  translationSystem,
} from "../prompts/translation.prompt";

const Translations = z.object({
  translations: z.array(z.object({ index: z.number(), text: z.string() })),
});

/** Texts per AI call. */
const BATCH = 40;

/** Words of three or more letters: a text without any is maths only and stays as it is. */
const HAS_WORDS = /\p{L}{3,}/u;

const hashOf = (text: string) =>
  createHash("sha256").update(text).digest("hex");

/**
 * Translates Uzbek app content into Russian or English with the AI, caching every text in
 * text_translations so it is translated once per language for all students. Uzbek passes through
 * untouched (no database or AI call). If the AI is unavailable the original text is returned.
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly llm: LlmService,
  ) {}

  /** The texts in `language`, in the same order; null and empty values pass through. */
  async translate<T extends string | null | undefined>(
    texts: T[],
    language: AppLanguage,
  ): Promise<T[]> {
    if (language === "uz") return texts;
    const wanted = [
      ...new Set(
        texts
          .filter((t): t is NonNullable<T> & string => Boolean(t?.trim()))
          .map((t) => t.trim())
          .filter((t) => HAS_WORDS.test(t)),
      ),
    ];
    if (!wanted.length) return texts;
    const known = new Map<string, string>();
    const rows: { source_hash: string; translated_text: string }[] =
      await this.dataSource.query(
        `SELECT source_hash, translated_text FROM text_translations
          WHERE language = $1 AND source_hash = ANY($2)`,
        [language, wanted.map(hashOf)],
      );
    const byHash = new Map(rows.map((r) => [r.source_hash, r.translated_text]));
    const missing: string[] = [];
    for (const text of wanted) {
      const cached = byHash.get(hashOf(text));
      if (cached !== undefined) known.set(text, cached);
      else missing.push(text);
    }
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      for (const [source, translated] of await this.translateBatch(
        batch,
        language,
      )) {
        known.set(source, translated);
      }
    }
    return texts.map((t) =>
      t?.trim() ? ((known.get(t.trim()) ?? t) as T) : t,
    );
  }

  /** One AI call for up to BATCH texts; saves the results. On failure, nothing is translated. */
  private async translateBatch(
    texts: string[],
    language: AppLanguage,
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    try {
      const { translations } = await this.llm.chatJson({
        purpose: `translation:${language}`,
        system: translationSystem(language),
        messages: [{ role: "user", content: translationMessage(texts) }],
        schema: Translations,
        effort: "low",
        maxTokens: 8_000,
      });
      for (const { index, text } of translations) {
        const source = texts[index];
        if (source === undefined || !text.trim()) continue;
        result.set(source, text.trim());
      }
    } catch (error) {
      if (!(error instanceof AiUnavailableException)) throw error;
      this.logger.warn(
        `translation to ${language} unavailable, showing Uzbek: ${error.message}`,
      );
      return result;
    }
    for (const [source, translated] of result) {
      await this.dataSource.query(
        `INSERT INTO text_translations (source_hash, language, source_text, translated_text)
         VALUES ($1, $2, $3, $4) ON CONFLICT (source_hash, language) DO NOTHING`,
        [hashOf(source), language, source, translated],
      );
    }
    return result;
  }
}
