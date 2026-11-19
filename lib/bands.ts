// Band estimates per section and the practice streak (PRD v2). Always ranges, never a single number.
// Pure, so `node --test` covers it.

export type Section = "reading" | "listening" | "writing" | "speaking";
export interface BandRange { mid: number; low: number; high: number; samples: number }

const half = (n: number) => Math.round(n * 2) / 2;
const range = (mid: number, spread: number, samples: number): BandRange =>
  ({ mid, low: Math.max(0, mid - spread), high: Math.min(9, mid + spread), samples });

// IELTS GT Reading raw score (/40) → band. The PRD fixes 35 ≈ 7 and 30 ≈ 6 (official averages);
// shortcut: the other points approximate the usual GT table, replace them once an exact table is settled.
const READING_CURVE: [number, number][] = [[0, 2.5], [15, 4], [23, 5], [30, 6], [35, 7], [40, 9]];

export function readingBandFromRaw(raw40: number): number {
  const x = Math.min(40, Math.max(0, raw40));
  for (let i = 1; i < READING_CURVE.length; i++) {
    const [x0, y0] = READING_CURVE[i - 1], [x1, y1] = READING_CURVE[i];
    if (x <= x1) return half(y0 + ((x - x0) / (x1 - x0)) * (y1 - y0));
  }
  return 9;
}

/** Last 80 Reading answers (newest first), scaled to /40, shown ±0.5. */
export function readingBand(correctFlags: boolean[]): BandRange | null {
  const recent = correctFlags.slice(0, 80);
  if (recent.length === 0) return null;
  const raw40 = (recent.filter(Boolean).length / recent.length) * 40;
  return range(readingBandFromRaw(raw40), 0.5, recent.length);
}

/** Writing: last 5 task bands (newest first), Task 2 counted twice as in the real test, shown ±1. */
export function writingBand(attempts: { band: number; task2: boolean }[]): BandRange | null {
  const recent = attempts.slice(0, 5);
  if (recent.length === 0) return null;
  const weight = (a: { task2: boolean }) => (a.task2 ? 2 : 1);
  const total = recent.reduce((s, a) => s + a.band * weight(a), 0) / recent.reduce((s, a) => s + weight(a), 0);
  return range(half(total), 1, recent.length);
}

/** Speaking: last 5 answer bands (newest first), shown ±1. */
export function speakingBand(bands: number[]): BandRange | null {
  const recent = bands.slice(0, 5);
  if (recent.length === 0) return null;
  return range(half(recent.reduce((a, b) => a + b, 0) / recent.length), 1, recent.length);
}

// Below these sample sizes a band is too noisy to steer the Practice Session.
export const MIN_SAMPLES: Record<Section, number> = { reading: 20, listening: 20, writing: 3, speaking: 3 };

/** The section holding the Learner back: lowest midpoint among sections with enough data. */
export function lowestSection(bands: Partial<Record<Section, BandRange | null>>): Section | null {
  const scored = (Object.entries(bands) as [Section, BandRange | null][]).filter(([s, b]) => b && b.samples >= MIN_SAMPLES[s]);
  if (scored.length === 0) return null;
  return scored.reduce((lo, cur) => (cur[1]!.mid < lo[1]!.mid ? cur : lo))[0];
}

/** "YYYY-MM-DD" of a moment in WIB (UTC+7). */
export const wibDay = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

/** Consecutive WIB days with practice, ending today (or yesterday, if today has none yet). */
export function streakDays(practiceDays: Iterable<string>, now: Date): number {
  const days = new Set(practiceDays);
  let day = new Date(`${wibDay(now)}T00:00:00Z`);
  if (!days.has(day.toISOString().slice(0, 10))) day = new Date(day.getTime() - 86_400_000);
  let n = 0;
  while (days.has(day.toISOString().slice(0, 10))) { n++; day = new Date(day.getTime() - 86_400_000); }
  return n;
}
