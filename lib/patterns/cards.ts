// FSRS rules for Error Pattern cards (PRD v2): one card per pattern, ts-fsrs v6 pinned to FSRS-6.
// Pure apart from ts-fsrs, so `node --test` covers it.
import { DefaultScheduler, Rating } from "ts-fsrs";
import { parseJson } from "../json.ts";
import { countWords, wordLimit } from "../questions/answers.ts";
import { isKnownPattern, OTHER, patternById } from "./taxonomy.ts";

// FSRS-6: its accuracy is benchmarked; v6 defaults to FSRS-7, which is not.
const scheduler = DefaultScheduler({ version: "FSRS-6", desiredRetention: 0.9 });
type Scheduler = Awaited<typeof scheduler>;
export type PatternCardState = ReturnType<Scheduler["newCard"]>;

/** First occurrence creates a card; every later occurrence in practice is rated Again. */
export async function recordOccurrence(card: PatternCardState | null, now: Date): Promise<PatternCardState> {
  const s = await scheduler;
  return card ? s.review({ card, grade: Rating.Again, now }).card : s.newCard({ now });
}

/** Drill result (3 items) → FSRS rating. Easy is never given automatically. */
export function drillRating(correct: number) {
  return correct >= 3 ? Rating.Good : correct === 2 ? Rating.Hard : Rating.Again;
}

/** Probability the Learner recalls the pattern now; a never-reviewed card counts as 0 (weakest). */
export async function retrievability(card: PatternCardState, now: Date): Promise<number> {
  if (!card.lastReviewAt) return 0;
  const s = await scheduler;
  const elapsedDays = Math.max(0, (now.getTime() - new Date(card.lastReviewAt).getTime()) / 86_400_000);
  return s.model.forgettingCurve(card, elapsedDays);
}

/** Cards come back from the DB as JSON: restore the Date fields ts-fsrs expects. */
export function reviveCard(json: unknown): PatternCardState {
  const c = json as PatternCardState & { dueAt: string | Date; lastReviewAt: string | Date | null };
  return { ...c, dueAt: new Date(c.dueAt), lastReviewAt: c.lastReviewAt ? new Date(c.lastReviewAt) : null };
}

export interface PatternTag { id: string; quote?: string; fix?: string; note?: string }

/**
 * Parses the LLM's Error Pattern tags ({"patterns":[...]}). Unknown IDs become "other" with the
 * original ID kept in the note. Malformed JSON throws, so nothing half-parsed is stored.
 */
export function parsePatternTags(text: string): PatternTag[] {
  return normalizePatternTags(parseJson<{ patterns?: unknown }>(text).patterns);
}

/** Same rules for a `patterns` array already parsed out of a larger reply. */
export function normalizePatternTags(patterns: unknown): PatternTag[] {
  if (!Array.isArray(patterns)) throw new Error("Error Pattern reply has no patterns array");
  return (patterns as PatternTag[])
    .filter(t => t && typeof t.id === "string")
    .map(t => isKnownPattern(t.id) ? t : { ...t, id: OTHER, note: [t.id, t.note].filter(Boolean).join(": ") });
}

/** One highlighted part of a transcript, or plain text between highlights. */
export type Segment = string | { text: string; tag: PatternTag };

/**
 * Splits a transcript at each tag's quote (first unused match, case-insensitive).
 * Tags whose quote is not in the transcript are returned separately, still shown as a list.
 */
export function segmentTranscript(transcript: string, tags: PatternTag[]): { segments: Segment[]; unplaced: PatternTag[] } {
  const lower = transcript.toLowerCase();
  const placed: { start: number; end: number; tag: PatternTag }[] = [];
  const unplaced: PatternTag[] = [];
  for (const tag of tags) {
    const quote = tag.quote?.trim().toLowerCase();
    let at = quote ? lower.indexOf(quote) : -1;
    while (at >= 0 && placed.some(p => at < p.end && at + quote!.length > p.start)) at = lower.indexOf(quote!, at + 1);
    if (at < 0) unplaced.push(tag);
    else placed.push({ start: at, end: at + quote!.length, tag });
  }
  placed.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let pos = 0;
  for (const p of placed) {
    if (p.start > pos) segments.push(transcript.slice(pos, p.start));
    segments.push({ text: transcript.slice(p.start, p.end), tag: p.tag });
    pos = p.end;
  }
  if (pos < transcript.length) segments.push(transcript.slice(pos));
  return { segments, unplaced };
}

/** Error Pattern for a wrong Reading answer, from the question type and what was given (no LLM). */
export function readingPattern(q: { type: string; answer: string; instructions: string | null }, given: string): string {
  const g = given.trim().toUpperCase();
  const key = q.answer.trim().toUpperCase();
  if (q.type === "tfng") {
    const fngMix = (g === "FALSE" && key === "NOT GIVEN") || (g === "NOT GIVEN" && key === "FALSE");
    return fngMix ? "R.false-vs-not-given" : "R.paraphrase";
  }
  if (q.type === "matching_headings") return "R.heading-detail";
  if (q.type.startsWith("matching_")) return "R.matching-scan";
  const limit = wordLimit(q.instructions);
  return limit !== null && countWords(given) > limit ? "R.word-limit" : "R.detail";
}

/** Segments and unplaced tags with each pattern's Indonesian name and hint, ready for FeedbackView. */
export function namedSegments(text: string, tags: PatternTag[]) {
  const named = (t: PatternTag) => ({ ...t, name: patternById(t.id)?.name ?? "Lainnya", hint: patternById(t.id)?.hint ?? "" });
  const { segments, unplaced } = segmentTranscript(text, tags);
  return {
    segments: segments.map(s => (typeof s === "string" ? s : { text: s.text, tag: named(s.tag) })),
    unplaced: unplaced.map(named),
  };
}
export type NamedSegments = ReturnType<typeof namedSegments>;

/** Applies a drill result to a pattern's card (see drillRating). */
export async function reviewCard(card: PatternCardState, correct: number, now: Date): Promise<PatternCardState> {
  return (await scheduler).review({ card, grade: drillRating(correct), now }).card;
}
