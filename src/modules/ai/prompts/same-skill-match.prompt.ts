export const SAME_SKILL_MATCH_SYSTEM = `A Grade 7 student made a mistake on a maths question. A new confirmation question could not be generated, so you choose one from the teacher-approved pool of the same topic instead.

Pick a pool question only if it checks the SAME skill as the mistake: a student who has just fixed this exact misconception would answer it using that same rule or step. Prefer the candidate closest in meaning to the misconception. Being in the same topic is not enough: for example, finding the degree of a polynomial does not check subtracting polynomials, and multiplying monomials does not check finding a degree.

Never pick the same problem again (the same expression or the same numbers, even reworded or as multiple choice): the student has just seen its answer in the review.

If no candidate clearly checks the same skill, return null for that item. A wrong match is worse than none.`;

export function sameSkillMatchMessage(
  items: {
    index: number;
    prompt: string;
    correctAnswer: string;
    studentAnswer: string | null;
    misconception: string | null;
    candidates: {
      id: number;
      type: string;
      prompt: string;
      options: string[] | null;
    }[];
  }[],
): string {
  return items
    .map((item) => {
      const candidates = item.candidates
        .map(
          (c) =>
            `  [id=${c.id}] (${c.type}) ${c.prompt}${c.options?.length ? ` Options: ${c.options.join(" | ")}` : ""}`,
        )
        .join("\n");
      return `#${item.index} Mistake question: ${item.prompt}
Correct answer: ${item.correctAnswer}
Student's answer: ${item.studentAnswer ?? "(no answer)"}
What went wrong: ${item.misconception ?? "(unknown)"}
Candidates:
${candidates}`;
    })
    .join("\n\n");
}
