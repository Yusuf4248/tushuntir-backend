import { UZBEK_OUTPUT_RULES } from "./uzbek-output.prompt";

export interface PromptChunk {
  id: number;
  page: number | null;
  content: string;
}

export const QUESTION_GENERATION_SYSTEM = `You write quiz questions for Grade 7 students in Uzbekistan, based on one section of their textbook.

Rules for every question:
- It must be answerable using ONLY the textbook text you are given. Do not rely on rules, formulas or facts that are not in the text.
- type "multiple_choice": exactly 4 options, one correct and three wrong options that a student could plausibly choose because of a typical mistake. Options are short (an answer, not an explanation) and all different.
- type "short_answer": the answer is one number or one short expression (at most 20 characters), so it can be checked automatically. Use an empty options list.
- correct_answer: for multiple_choice copy the correct option text exactly; for short_answer give the answer in its simplest form.
- hints: exactly 3, from weakest to strongest:
  1. a nudge: a question or reminder that points to the idea needed;
  2. a clue: the rule or formula to use and how to start;
  3. a worked example of a SIMILAR problem with different numbers, solved step by step.
  No hint may contain or give away the answer to this question.
- explanation: 2-4 sentences on why the correct answer is right, shown after the student answers.
- option_misconceptions: multiple_choice only. One entry for each of the 3 wrong options (copy the option text exactly) with the mistake or misconception a student who picks it most likely has. Empty list for short_answer.
- source_chunk_id: the id of the text fragment the question is based on.
- Vary the numbers, the wording and the skills tested; never repeat a question.

${UZBEK_OUTPUT_RULES}`;

export const DIFFICULTY_LEVELS: Record<number, string> = {
  1: "1 (recall: state or recognise a rule, definition or formula from the text)",
  2: "2 (apply: use a rule in one or two steps with new numbers)",
  3: "3 (reason: several steps, a word problem, or spotting a typical mistake)",
};

export function questionGenerationMessage(input: {
  topicTitle: string;
  keyIdeas: string[];
  chunks: PromptChunk[];
  difficulty: number;
  multipleChoice: number;
  shortAnswer: number;
}): string {
  const fragments = input.chunks
    .map(
      (chunk) =>
        `[fragment id=${chunk.id}${chunk.page ? `, page ${chunk.page}` : ""}]\n${chunk.content}`,
    )
    .join("\n\n");
  const ideas = input.keyIdeas.length
    ? `\nKey ideas of the topic:\n${input.keyIdeas.map((idea) => `- ${idea}`).join("\n")}\n`
    : "";
  return `Topic: ${input.topicTitle}
${ideas}
Textbook text:
${fragments}

Write ${input.multipleChoice + input.shortAnswer} questions of difficulty ${DIFFICULTY_LEVELS[input.difficulty]}: ${input.multipleChoice} multiple_choice and ${input.shortAnswer} short_answer.`;
}
