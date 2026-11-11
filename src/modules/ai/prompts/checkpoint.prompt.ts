import { UZBEK_OUTPUT_RULES } from "./uzbek-output.prompt";

/** Lines Sardor says are read aloud, so maths must be written as it is spoken. */
const SPOKEN_RULES = `Sardor's lines are read aloud by text-to-speech, so in them:
- write maths as it is spoken in Uzbek: "a kvadrat", "ikki a b", "x teng besh", "uch karra x", "minus to'rt";
- no symbols such as ^, *, /, =, brackets or emoji; no lists or markdown.`;

export const CHECKPOINT_OPENING_SYSTEM = `You write the opening line of a "Teach me" checkpoint in a maths app for Grade 7.

Sardor is the student's classmate. He has understood one idea of the topic wrongly and is sure he is right. In 2-3 short sentences he states his wrong belief as his own, with one tiny concrete example of the wrong reasoning, and asks the student to explain where he is wrong and why.

- If the student's own latest mistake is given, Sardor's misconception is that same mistake with different numbers. Never say it was the student's mistake.
- Otherwise pick a common mistake on one of the key ideas.
- If earlier openings are listed, pick a different idea or a different angle.
- Sardor never gives the correct rule himself.

${SPOKEN_RULES}

${UZBEK_OUTPUT_RULES}`;

export function checkpointOpeningMessage(input: {
  topicTitle: string;
  keyIdeas: string[];
  text: string;
  mistake: {
    prompt: string;
    studentAnswer: string;
    correctAnswer: string;
    misconception: string | null;
  } | null;
  earlierOpenings: string[];
}): string {
  const mistake = input.mistake
    ? `The student's latest mistake in this topic:\nQuestion: ${input.mistake.prompt}\nStudent's answer: ${input.mistake.studentAnswer}\nCorrect answer: ${input.mistake.correctAnswer}${input.mistake.misconception ? `\nWhat went wrong: ${input.mistake.misconception}` : ""}`
    : "The student has no recorded mistake in this topic.";
  const earlier = input.earlierOpenings.length
    ? `\n\nEarlier openings (do not repeat):\n${input.earlierOpenings.map((o) => `- ${o}`).join("\n")}`
    : "";
  return `Topic: ${input.topicTitle}

Key ideas:
${input.keyIdeas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}

Textbook text:
${input.text}

${mistake}${earlier}`;
}

export type CheckpointStage = "first" | "final";

export const CHECKPOINT_JUDGE_SYSTEM = `You judge a Grade 7 student's explanation in a "Teach me" checkpoint of a maths app. The classmate Sardor stated a wrong belief and the student explained the topic to him.

Judge meaning, not wording:
- The explanation may mix Uzbek and Russian. Read it charitably: judge what the student meant.
- When it was spoken, it is a speech-to-text transcript, and recognition often drops or garbles short words: a letter after a number ("besh" for "besh x"), "kavs" for "qavs". If an example in a spoken answer is wrong only because of such a missing or garbled word, and the student's own stated rule gives the right result, treat it as a recognition error, not a wrong statement. A claim that states a misconception (for example "harfiy qismlar ham qo'shiladi", or a result like "besh x kvadrat") is still a wrong statement.
- A key idea is covered when the student states it in their own words or clearly uses it in a correct example. It does not have to match the textbook wording.
- A wrong statement is a mathematically false claim the student makes and does not correct. Recognition errors, slips corrected right away and informal wording are not wrong statements.
- When the stage is "final", judge the first explanation and the answer to Sardor's follow-up together.

Then write Sardor's reaction texts (fill only the fields the stage asks for, use "" for the others):
- praise: one warm sentence from Sardor thanking the student and saying what he now understands.
- follow_up (stage "first" only): ONE short question from Sardor that makes the student explain the most important missing idea or rethink the wrong statement. It must not contain the answer.
- explanation (stage "final" only): 2-4 short sentences addressed to the student (not from Sardor) that correctly explain the missing ideas or correct the wrong statements, with one small example.
- next_question (stage "final" only): Sardor's new opening for the next try: 1-2 sentences with a different wrong belief or angle on the topic, asking to be taught again.

${SPOKEN_RULES} (This applies to praise, follow_up and next_question; explanation is read on screen and may use maths notation.)

${UZBEK_OUTPUT_RULES}`;

export function checkpointJudgeMessage(input: {
  topicTitle: string;
  keyIdeas: string[];
  opening: string;
  explanation: string;
  followUp: string | null;
  followUpAnswer: string | null;
  stage: CheckpointStage;
  spoken: boolean;
}): string {
  const followUp =
    input.followUp !== null
      ? `\n\nSardor's follow-up question:\n${input.followUp}\n\nStudent's answer to the follow-up:\n${input.followUpAnswer ?? ""}`
      : "";
  return `Stage: ${input.stage}
Answer given: ${input.spoken ? "spoken (speech-to-text transcript)" : "typed"}
Topic: ${input.topicTitle}

Key ideas:
${input.keyIdeas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}

Sardor said:
${input.opening}

Student's explanation:
${input.explanation}${followUp}`;
}
