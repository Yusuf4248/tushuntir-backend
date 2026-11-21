import { Injectable } from "@nestjs/common";
import { AppLanguage } from "../../common/i18n/language";
import { TranslationService } from "../ai/translation/translation.service";

/**
 * Collects the strings of a response, translates them in one go (cached per text) and writes
 * the translations back. Answer options are translated as a group: if two options of one question
 * would get the same translation, that question keeps its original options, so every shown
 * option still maps back to exactly one original for grading.
 */
export class TranslationBatch {
  private readonly texts: { text: string; set: (t: string) => void }[] = [];
  private readonly groups: {
    originals: string[];
    set: (shown: string[]) => void;
  }[] = [];

  constructor(
    private readonly translation: TranslationService,
    readonly language: AppLanguage,
  ) {}

  text(text: string | null | undefined, set: (t: string) => void): this {
    if (this.language !== "uz" && text) this.texts.push({ text, set });
    return this;
  }

  options(
    originals: string[] | null | undefined,
    set: (shown: string[]) => void,
  ): this {
    if (this.language !== "uz" && originals?.length) {
      this.groups.push({ originals, set });
    }
    return this;
  }

  async run(): Promise<void> {
    if (this.language === "uz") return;
    const all = [
      ...this.texts.map((t) => t.text),
      ...this.groups.flatMap((g) => g.originals),
    ];
    if (!all.length) return;
    const translated = await this.translation.translate(all, this.language);
    let i = 0;
    for (const item of this.texts) item.set(translated[i++]);
    for (const group of this.groups) {
      const shown = group.originals.map(() => translated[i++]);
      if (new Set(shown).size === shown.length) group.set(shown);
    }
  }
}

/** Student-facing translation of quiz content; Uzbek requests are left untouched. */
@Injectable()
export class StudentTranslator {
  constructor(private readonly translation: TranslationService) {}

  batch(language: AppLanguage): TranslationBatch {
    return new TranslationBatch(this.translation, language);
  }

  texts<T extends string | null | undefined>(
    texts: T[],
    language: AppLanguage,
  ): Promise<T[]> {
    return this.translation.translate(texts, language);
  }

  /**
   * The original option for an answer the student sent in their language (the translated option
   * text), or null when it matches none. Grading always uses the original.
   */
  async originalOption(
    options: string[],
    given: string,
    language: AppLanguage,
  ): Promise<string | null> {
    const originals = options.map((o) => o.trim());
    if (originals.includes(given)) return given;
    if (language === "uz") return null;
    const shown = (await this.translation.translate(originals, language)).map(
      (o) => o.trim(),
    );
    if (new Set(shown).size !== shown.length) return null;
    const index = shown.indexOf(given);
    return index >= 0 ? originals[index] : null;
  }
}
