import { test } from "node:test";
import assert from "node:assert/strict";
import { fluencyMetrics, type TimedWord } from "./metrics.ts";
import { overallBand as speakingBand } from "../scoring.ts";

// "I use my laptop um every day [2.5 s pause] because I work"
const fixture: TimedWord[] = [
  { word: "I", start: 0.0, end: 0.2 },
  { word: "use", start: 0.3, end: 0.5 },
  { word: "my", start: 0.6, end: 0.7 },
  { word: "laptop", start: 0.8, end: 1.3 },
  { word: "um,", start: 2.0, end: 2.3 },      // 0.7 s pause before
  { word: "every", start: 2.4, end: 2.7 },
  { word: "day.", start: 2.8, end: 3.0 },
  { word: "Because", start: 5.5, end: 5.9 },  // 2.5 s long pause before
  { word: "I", start: 6.0, end: 6.1 },
  { word: "work", start: 6.2, end: 6.6 },
];

test("fluency metrics from word timestamps", () => {
  const m = fluencyMetrics(fixture);
  assert.equal(m.words, 10);
  assert.equal(m.speakingSeconds, 6.6);
  assert.equal(m.wpm, 91);            // 10 words / 6.6 s
  assert.equal(m.pauses, 2);          // 0.7 s and 2.5 s
  assert.equal(m.longPauses, 1);      // only the 2.5 s one
  assert.equal(m.meanLengthOfRun, 3.3); // 10 words over 3 runs
  assert.equal(m.fillers, 1);
  assert.equal(m.fillerRate, 10);
});

test("an empty transcript gives zeros instead of dividing by zero", () => {
  assert.equal(fluencyMetrics([]).wpm, 0);
});

test("overall Speaking band is the criterion mean rounded to 0.5, shown as ±1", () => {
  assert.deepEqual(speakingBand([6, 6.5, 5.5]), { mid: 6, low: 5, high: 7 });
  assert.deepEqual(speakingBand([6, 6.5, 6.5]), { mid: 6.5, low: 5.5, high: 7.5 });
  assert.deepEqual(speakingBand([9, 9, 8.5]), { mid: 9, low: 8, high: 9 });
});

test("FC patterns are raised from the metrics alone", async () => {
  const { fluencyPatterns } = await import("./metrics.ts");
  const base = fluencyMetrics(fixture); // 10 words, 1 long pause, 10% fillers
  assert.deepEqual(fluencyPatterns(base, "speaking_p2").map(p => p.id), ["FC.fillers", "FC.short-answers"]);
  assert.deepEqual(fluencyPatterns({ ...base, longPauses: 3, fillerRate: 0, words: 200 }, "speaking_p2").map(p => p.id), ["FC.long-pauses"]);
  assert.deepEqual(fluencyPatterns({ ...base, fillerRate: 1, words: 30 }, "speaking_p1"), []);
});
