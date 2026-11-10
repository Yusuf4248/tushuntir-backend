/**
 * Lenient comparison of a typed answer with the answer key: case, spaces, minus/multiply
 * signs, decimal commas and a leading "x =" are ignored, and numbers (including fractions
 * such as 3/4) are compared by value.
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[×·∙]/g, "*")
    .replace(/[ʻ‘’`]/g, "'")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, "")
    .replace(/^[a-z]=/, "")
    .replace(/[.;]+$/, "");
}

function numericValue(value: string): number | null {
  const fraction = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(value);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? null : Number(fraction[1]) / denominator;
  }
  return /^-?\d+(?:\.\d+)?$/.test(value) ? Number(value) : null;
}

export function answersMatch(given: string, expected: string): boolean {
  const a = normalizeAnswer(given);
  const b = normalizeAnswer(expected);
  if (!a) return false;
  if (a === b) return true;
  const x = numericValue(a);
  const y = numericValue(b);
  return x !== null && y !== null && Math.abs(x - y) < 1e-9;
}

/**
 * Whether a worked explanation arrives at the answer key: a numeric key must appear among the
 * explanation's numbers, any other key in its text. Catches generated questions whose key
 * disagrees with their own working (e.g. key 7, working ends in 9).
 */
export function explanationReaches(
  explanation: string,
  answer: string,
): boolean {
  const key = normalizeAnswer(answer);
  const value = numericValue(key);
  const text = normalizeAnswer(explanation);
  if (value === null) return text.includes(key);
  const numbers = text.match(/-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?/g) ?? [];
  return numbers.some((n) => {
    const v = numericValue(n);
    // "-1" may be a subtraction sign before 1, so the unsigned value counts too.
    return (
      v !== null &&
      (Math.abs(v - value) < 1e-9 || Math.abs(Math.abs(v) - value) < 1e-9)
    );
  });
}
