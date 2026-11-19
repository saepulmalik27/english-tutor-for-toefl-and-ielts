// Composes today's 30-minute Practice Session (PRD v2, prototype variant A). Pure, so `node --test` covers it.
import type { Section } from "../bands.ts";

export type BlockType = "speaking" | "reading" | "writing_t1" | "writing_t2" | "review" | "extra_reading" | "extra_speaking";
export interface Block { type: BlockType; minutes: number }
export interface Plan { blocks: Block[]; reason: string }

const MIDDLE: Record<"reading" | "writing_t1" | "writing_t2", Block> = {
  reading: { type: "reading", minutes: 9 },
  writing_t1: { type: "writing_t1", minutes: 20 },
  writing_t2: { type: "writing_t2", minutes: 40 },
};
// First week: every Skill gets data, including one Task 1 and one Task 2 (Speaking runs daily anyway).
const FIRST_WEEK: (keyof typeof MIDDLE)[] = ["reading", "writing_t1", "reading", "writing_t2", "reading", "reading", "reading"];
const WRITING_SWAPS_PER_WEEK = 2;

export interface ComposeInput {
  dayIndex: number;            // 0 for the first session day, counted in WIB days since then
  lowest: Section | null;      // lowest section with enough data (lib/bands lowestSection)
  writingSwapsThisWeek: number; // sessions this week where Task 1 replaced Reading because Writing was lowest
  reviewDue: boolean;          // at least one Error Pattern due with drills ready
}

export function composeSession(i: ComposeInput): Plan {
  const firstWeek = i.dayIndex < 7;
  let middle = MIDDLE.reading;
  let reason: string;
  if (firstWeek) {
    middle = MIDDLE[FIRST_WEEK[i.dayIndex]];
    reason = `Minggu pertama (hari ${i.dayIndex + 1} dari 7): semua Skill dicoba dulu supaya ada data band untuk setiap section.`;
  } else if (i.lowest === "writing" && i.writingSwapsThisWeek < WRITING_SWAPS_PER_WEEK) {
    middle = MIDDLE.writing_t1;
    reason = "Writing adalah section terendahmu, jadi Writing Task 1 menggantikan Reading hari ini (maksimal 2 kali seminggu).";
  } else {
    reason = i.lowest
      ? `Section terendahmu saat ini: ${i.lowest[0].toUpperCase()}${i.lowest.slice(1)}.`
      : "Belum cukup data untuk menentukan section terendah.";
  }
  // Empty review slot → extra practice for the lowest section (Writing does not fit in 6 minutes).
  const last: Block = i.reviewDue
    ? { type: "review", minutes: 6 }
    : { type: i.lowest === "speaking" ? "extra_speaking" : "extra_reading", minutes: 6 };
  return { blocks: [{ type: "speaking", minutes: 15 }, middle, last], reason };
}

/** WIB days between two "YYYY-MM-DD" strings. */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** Monday (WIB) of the week containing a "YYYY-MM-DD" day. */
export function weekStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}
