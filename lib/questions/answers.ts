// Answer checking for IELTS Reading items (pure). Answer keys follow ielts.org conventions:
// "(words)" in brackets are optional, alternatives are separated by "|".

const normalize = (s: string) =>
  s.toLowerCase().replace(/[“”"'’.,;:!?]/g, "").replace(/\s+/g, " ").trim();

/** Every accepted spelling of one key alternative: with and without the optional bracketed words. */
function forms(alt: string): string[] {
  return [alt.replace(/[()]/g, ""), alt.replace(/\([^)]*\)/g, "")].map(normalize);
}

export function isCorrect(given: string, key: string): boolean {
  const g = normalize(given);
  return g.length > 0 && key.split("|").some(alt => forms(alt).includes(g));
}

const NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

/** "Choose NO MORE THAN TWO WORDS ..." → 2; null when the instructions set no word limit. */
export function wordLimit(instructions: string | null | undefined): number | null {
  if (/\bone word only\b/i.test(instructions ?? "")) return 1;
  const m = instructions?.match(/no more than (one|two|three|four|five|\d+) words?/i);
  if (!m) return null;
  return NUMBERS[m[1].toLowerCase()] ?? Number(m[1]);
}

export const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;
