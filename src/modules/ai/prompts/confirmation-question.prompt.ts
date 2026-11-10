import { PromptChunk } from "./question-generation.prompt";

/** Uses QUESTION_GENERATION_SYSTEM as the system prompt; this is the user message. */
export function confirmationQuestionMessage(input: {
  topicTitle: string;
  chunks: PromptChunk[];
  originals: {
    id: number;
    type: string;
    prompt: string;
    options: string[] | null;
    correctAnswer: string;
  }[];
}): string {
  const fragments = input.chunks
    .map(
      (chunk) =>
        `[fragment id=${chunk.id}${chunk.page ? `, page ${chunk.page}` : ""}]\n${chunk.content}`,
    )
    .join("\n\n");
  const originals = input.originals
    .map(
      (q) =>
        `original_id=${q.id} (${q.type}) ${q.prompt}${q.options ? `\nOptions: ${q.options.map((o) => `"${o}"`).join(", ")}` : ""}\nCorrect answer: ${q.correctAnswer}`,
    )
    .join("\n\n");
  return `Topic: ${input.topicTitle}

Textbook text:
${fragments}

A student got each question below wrong. For EACH one write exactly one new confirmation question that tests the SAME skill with NEW numbers or a new example (same type; for multiple_choice the wrong options should reflect the same typical mistakes). Set original_id to the id of the question it replaces. It must not be answerable by copying the original's answer.

${originals}`;
}
