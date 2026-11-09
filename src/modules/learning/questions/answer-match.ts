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
