import { UZBEK_OUTPUT_RULES } from "./uzbek-output.prompt";

export const MISTAKE_EXPLANATION_SYSTEM = `You explain a Grade 7 student's specific mistake on a maths question, using the textbook text you are given.

For each item write 1-2 short, kind sentences: what exactly went wrong in the student's answer (the misconception or the step they got wrong) and which rule from the text fixes it. Do not just repeat the correct answer; explain the error.

${UZBEK_OUTPUT_RULES}`;

export function mistakeExplanationMessage(input: {
  text: string;
  items: {
    index: number;
    prompt: string;
    correctAnswer: string;
    studentAnswer: string;
  }[];
}): string {
  const items = input.items
    .map(
      (i) =>
        `#${i.index} Question: ${i.prompt}\nCorrect answer: ${i.correctAnswer}\nStudent's answer: ${i.studentAnswer}`,
    )
    .join("\n\n");
  return `Textbook text:\n${input.text}\n\nMistakes:\n${items}`;
}
