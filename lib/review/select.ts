// Review block rules (PRD v2): at most 2 due Error Patterns per day, lowest retrievability first,
// 3 fresh drills each; a backlog drains 2 per day. Pure, so `node --test` covers it.
import { fluencyPatterns, type FluencyMetrics } from "../speaking/metrics.ts";

export const DAILY_PATTERNS = 2;
export const DRILLS_PER_PATTERN = 3;
const PREP_HORIZON_DAYS = 2;

export interface DueCard { patternId: string; dueAt: Date; retrievability: number }

/** Today's patterns: due now, not yet reviewed today, weakest memory first, within the daily cap. */
export function pickDue(cards: DueCard[], reviewedToday: Set<string>, now: Date): DueCard[] {
  const slots = Math.max(0, DAILY_PATTERNS - reviewedToday.size);
  return cards
    .filter(c => c.dueAt <= now && !reviewedToday.has(c.patternId))
    .sort((a, b) => a.retrievability - b.retrievability)
    .slice(0, slots);
}

/** Cards the nightly job should prepare drills for: due within the next 2 days. */
export const dueSoon = (cards: DueCard[], now: Date) =>
  cards.filter(c => c.dueAt.getTime() <= now.getTime() + PREP_HORIZON_DAYS * 86_400_000);

/** Midnight in WIB (UTC+7, no DST): "today" for the Learner in Indonesia. */
export function startOfDayWIB(now: Date): Date {
  const wib = new Date(now.getTime() + 7 * 3_600_000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3_600_000);
}

export type DrillFormat = "mcq" | "tfng" | "completion" | "speaking";

/** Drill format that trains a pattern: speaking for FC, a short text for Reading, multiple choice otherwise. */
export function drillFormat(patternId: string): DrillFormat {
  if (patternId.startsWith("FC.")) return "speaking";
  if (patternId === "R.word-limit") return "completion";
  if (["R.false-vs-not-given", "R.paraphrase", "R.detail"].includes(patternId)) return "tfng";
  return "mcq"; // GRA, LR, CC, TA/TR, heading and matching patterns
}

/**
 * A speaking drill passes when the timing no longer shows the drilled pattern.
 * shortcut: FC.self-correction can't be seen in timestamps, so it passes on length alone; score it with the LLM if it matters.
 */
export function speakingDrillPassed(patternId: string, m: FluencyMetrics): boolean {
  if (patternId === "FC.self-correction") return m.words >= 25;
  return !fluencyPatterns(m, "speaking_p1").some(p => p.id === patternId);
}
