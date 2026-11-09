import { PromptChunk } from "./question-generation.prompt";

export const UNANSWERABLE = "UNANSWERABLE";

export const QUESTION_SELF_CHECK_SYSTEM = `You check quiz questions before students see them. Answer each question yourself, using ONLY the textbook text you are given.

- multiple_choice: reply with the exact text of the option you choose.
- short_answer: reply with only the final answer in its simplest form (a number or a short expression), no words.
- If the textbook text does not contain what is needed to answer a question, reply exactly ${UNANSWERABLE} for it.
- Work each question out carefully; return one answer per question, using the question's index.`;

export function questionSelfCheckMessage(input: {
  chunks: PromptChunk[];
  questions: {
    index: number;
    type: string;
    prompt: string;
    options: string[];
  }[];
}): string {
  const text = input.chunks.map((chunk) => chunk.content).join("\n\n");
  const questions = input.questions
    .map((q) =>
      q.type === "multiple_choice"
        ? `#${q.index} (multiple_choice) ${q.prompt}\nOptions: ${q.options.map((o) => `"${o}"`).join(", ")}`
        : `#${q.index} (short_answer) ${q.prompt}`,
    )
    .join("\n\n");
  return `Textbook text:\n${text}\n\nQuestions:\n${questions}`;
}
