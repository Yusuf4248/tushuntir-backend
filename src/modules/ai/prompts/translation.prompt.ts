import { AppLanguage } from "../../../common/i18n/language";
import { LANGUAGE_NAMES } from "./uzbek-output.prompt";

export function translationSystem(language: AppLanguage): string {
  return `You translate short texts from a Grade 7 maths app from Uzbek (Latin script) into ${LANGUAGE_NAMES[language]}: questions, answer options, hints, explanations and feedback.

- Translate the meaning naturally, in simple words a school student understands; use the usual school maths terms of ${LANGUAGE_NAMES[language]}.
- Keep every mathematical expression, number, variable, formula and symbol exactly as written (for example 3x^2 - 5x + 2, (a + b)^2, 2 · a, x = 5, √9).
- Keep the text's form: a question stays a question, a short option stays short, a "### 1-misol" style heading stays a heading.
- Do not add or drop anything and do not solve anything.
- Return one translation for every index.`;
}

export function translationMessage(texts: string[]): string {
  return texts.map((text, index) => `#${index}\n${text}`).join("\n\n");
}
