// Shared IELTS scoring for Speaking and Writing (PRD v2): per-criterion bands first, then Indonesian
// Feedback with Error Pattern tags in a separate call, so the output language does not sway the scores.
// `chat` is passed in so the parsing rules can be tested with a stub.
import { parseJson } from "./json.ts";
import { normalizePatternTags, type PatternTag } from "./patterns/cards.ts";
import { PATTERNS, type Skill } from "./patterns/taxonomy.ts";

export type Chat = (system: string, user: string) => Promise<string>;
export type Scores<C extends string> = Record<C, { band: number; reason: string }>;
export interface CoachFeedback<C extends string> { summary: string; criteria: Record<C, string>; patterns: PatternTag[] }

const toHalfBand = (n: unknown) => {
  const v = Number(n);
  if (!Number.isFinite(v)) throw new Error("score is not a number");
  return Math.min(9, Math.max(0, Math.round(v * 2) / 2));
};

/** Validates the scorer's JSON: every criterion present, bands clamped to 0–9 in 0.5 steps. */
export function parseCriterionScores<C extends string>(text: string, criteria: readonly C[]): Scores<C> {
  const raw = parseJson<Record<string, { band?: unknown; reason?: unknown }>>(text);
  return Object.fromEntries(criteria.map(c => {
    if (!raw[c]) throw new Error(`missing ${c} score`);
    return [c, { band: toHalfBand(raw[c].band), reason: String(raw[c].reason ?? "") }];
  })) as Scores<C>;
}

/** IELTS-style overall from criterion bands: mean rounded to the nearest 0.5, shown as a ±1 range. */
export function overallBand(bands: number[]): { mid: number; low: number; high: number } {
  const mid = Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2;
  return { mid, low: Math.max(0, mid - 1), high: Math.min(9, mid + 1) };
}

/** Taxonomy lines the coach may use for one skill (shared patterns included). */
export const patternList = (skill: Exclude<Skill, "writing_speaking">) =>
  PATTERNS.filter(p => p.skill === skill || p.skill === "writing_speaking").map(p => `${p.id}: ${p.name}`).join("\n");

/** Indonesian Feedback per criterion plus Error Pattern tags quoted from the learner's text. */
export async function coachFeedback<C extends string>(
  chat: Chat,
  o: { what: string; criteria: readonly C[]; patterns: string; task: string; text: string; scores: Scores<C> }
): Promise<CoachFeedback<C>> {
  const system = `You are an IELTS ${o.what} coach for an Indonesian learner. The scores are FINAL; do not change them.
Write short, concrete Feedback in Bahasa Indonesia (not English): what held each criterion back and one thing
to do next time, quoting the learner's own words where useful.
Also list each mistake in "patterns", using ONLY these Error Pattern IDs:
${o.patterns}
For each: "quote" copied EXACTLY from the learner's text (a few words), "fix" the corrected words, "note" a short
explanation in Bahasa Indonesia. Use "other" only if no ID fits. Respond with JSON only:
{"summary":"1-2 kalimat","criteria":{${o.criteria.map(c => `"${c}":"..."`).join(",")}},
 "patterns":[{"id":"GRA.tense-form","quote":"Yesterday I go","fix":"Yesterday I went","note":"..."}]}`;
  const raw = parseJson<{ summary?: unknown; criteria?: Record<string, unknown>; patterns?: unknown }>(
    await chat(system, `Task:\n${o.task}\n\nScores:\n${JSON.stringify(o.scores)}\n\nLearner's ${o.what === "Speaking" ? "transcript" : "text"}:\n${o.text}`)
  );
  return {
    summary: String(raw.summary ?? ""),
    criteria: Object.fromEntries(o.criteria.map(c => [c, String(raw.criteria?.[c] ?? "")])) as Record<C, string>,
    patterns: normalizePatternTags(raw.patterns ?? []),
  };
}
