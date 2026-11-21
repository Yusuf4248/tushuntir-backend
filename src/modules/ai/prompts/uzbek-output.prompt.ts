import { AppLanguage } from "../../../common/i18n/language";

/** Shared rules appended to every system prompt that produces text a student or teacher reads. */
export const UZBEK_OUTPUT_RULES = `Til qoidalari:
- Barcha matnni faqat o'zbek tilida, lotin alifbosida yoz (kirill harflarini ishlatma).
- O'zbek lotin alifbosidagi harflarni to'g'ri yoz: o', g', sh, ch, ng; tutuq belgisi uchun ' ishlat.
- 5-11-sinf o'quvchisi tushunadigan sodda, qisqa gaplar bilan yoz.
- Matematik ifodalarni oddiy matn ko'rinishida yoz: 3/4, x^2, 2 · (a + b), √9.`;

const RUSSIAN_OUTPUT_RULES = `Language rules:
- Write all text in Russian (Cyrillic script).
- Use simple, short sentences a Grade 5-11 student understands.
- Write maths as plain text: 3/4, x^2, 2 · (a + b), √9.`;

const ENGLISH_OUTPUT_RULES = `Language rules:
- Write all text in English.
- Use simple, short sentences a Grade 5-11 student understands.
- Write maths as plain text: 3/4, x^2, 2 · (a + b), √9.`;

/** The output rules for the student's language (Uzbek unchanged). */
export function outputRules(language: AppLanguage = "uz"): string {
  if (language === "ru") return RUSSIAN_OUTPUT_RULES;
  if (language === "en") return ENGLISH_OUTPUT_RULES;
  return UZBEK_OUTPUT_RULES;
}

/** The language's name as used inside English prompts. */
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  en: "English",
};
