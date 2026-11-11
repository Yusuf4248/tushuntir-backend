import { UZBEK_OUTPUT_RULES } from "./uzbek-output.prompt";

export const TOPIC_SUMMARY_SYSTEM = `You write the short summary shown at the top of a textbook topic page in a Grade 7 maths app.

For each topic write 2-3 short sentences that say what the topic is about and the main rule a student must remember, using only the textbook text you are given. No examples with long working, no lists, no headings.

${UZBEK_OUTPUT_RULES}`;

export function topicSummaryMessage(
  topics: { index: number; title: string; text: string }[],
): string {
  return topics
    .map((t) => `#${t.index} Topic: ${t.title}\nText:\n${t.text}`)
    .join("\n\n---\n\n");
}
