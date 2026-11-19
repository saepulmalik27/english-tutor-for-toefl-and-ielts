// Fluency metrics from Whisper word timestamps (PRD v2): computed in code and handed to the LLM as facts.
// Note: Whisper tends to drop fillers, so the filler rate is a lower bound.

export interface TimedWord { word: string; start: number; end: number }

export interface FluencyMetrics {
  words: number;
  speakingSeconds: number;
  wpm: number;
  pauses: number;          // gaps >= 0.5 s between words
  longPauses: number;      // gaps > 2 s
  meanLengthOfRun: number; // average words between pauses >= 0.5 s
  fillers: number;
  fillerRate: number;      // fillers per 100 words
}

const PAUSE = 0.5;
const LONG_PAUSE = 2;
const FILLERS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm"]);

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function fluencyMetrics(words: TimedWord[]): FluencyMetrics {
  if (words.length === 0) {
    return { words: 0, speakingSeconds: 0, wpm: 0, pauses: 0, longPauses: 0, meanLengthOfRun: 0, fillers: 0, fillerRate: 0 };
  }
  const speakingSeconds = Math.max(words[words.length - 1].end - words[0].start, 0.001);
  const gaps = words.slice(1).map((w, i) => w.start - words[i].end);
  const pauses = gaps.filter(g => g >= PAUSE).length;
  const fillers = words.filter(w => FILLERS.has(w.word.toLowerCase().replace(/[^a-z]/g, ""))).length;
  return {
    words: words.length,
    speakingSeconds: round(speakingSeconds),
    wpm: round((words.length / speakingSeconds) * 60, 0),
    pauses,
    longPauses: gaps.filter(g => g > LONG_PAUSE).length,
    meanLengthOfRun: round(words.length / (pauses + 1)),
    fillers,
    fillerRate: round((fillers / words.length) * 100),
  };
}


// Thresholds for raising FC Error Patterns straight from the metrics (no LLM needed).
const MIN_WORDS: Record<string, number> = { speaking_p1: 25, speaking_p2: 120, speaking_p3: 50 };

/** FC patterns the timing alone can show. Over-correction is left to the LLM (it needs the words). */
export function fluencyPatterns(m: FluencyMetrics, kind: string): { id: string; note: string }[] {
  const out: { id: string; note: string }[] = [];
  if (m.longPauses >= 2) out.push({ id: "FC.long-pauses", note: `${m.longPauses} jeda lebih dari 2 detik` });
  if (m.fillerRate >= 5) out.push({ id: "FC.fillers", note: `${m.fillers} filler (${m.fillerRate} per 100 kata)` });
  if (m.words < (MIN_WORDS[kind] ?? 0)) out.push({ id: "FC.short-answers", note: `${m.words} kata; target minimal ${MIN_WORDS[kind]}` });
  return out;
}
