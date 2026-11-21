import { AppLanguage } from "../../../common/i18n/language";
import { outputRules } from "./uzbek-output.prompt";

/** The feedback sentence is written in the student's language (Uzbek by default). */
export const shortAnswerCheckSystem = (
  language: AppLanguage = "uz",
) => `You check a Grade 7 student's short answer to a maths question against the answer key.

- is_correct: true only if the student's answer has the same value as the key or is the same expression written in another correct form (for example 0.5 and 1/2, or 2a+6 and 6+2a). A different value, an unfinished expression or a wrong sign is incorrect.
- feedback: one short, kind sentence for the student about their answer. Never state the correct answer.

${outputRules(language)}`;

export function shortAnswerCheckMessage(input: {
  prompt: string;
  answerKey: string;
  studentAnswer: string;
}): string {
  return `Question: ${input.prompt}\nAnswer key: ${input.answerKey}\nStudent's answer: ${input.studentAnswer}`;
}
