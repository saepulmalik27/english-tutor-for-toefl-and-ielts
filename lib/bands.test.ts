import { test } from "node:test";
import assert from "node:assert/strict";
import { lowestSection, readingBand, readingBandFromRaw, speakingBand, streakDays, wibDay, writingBand } from "./bands.ts";

test("Reading raw → band hits the PRD anchors and interpolates between them", () => {
  assert.equal(readingBandFromRaw(35), 7);
  assert.equal(readingBandFromRaw(30), 6);
  assert.equal(readingBandFromRaw(32.5), 6.5);
  assert.equal(readingBandFromRaw(40), 9);
  assert.equal(readingBandFromRaw(-3), 2.5);
});

test("Reading band uses the last 80 answers and is shown ±0.5", () => {
  const answers = [...Array(70).fill(true), ...Array(10).fill(false), ...Array(50).fill(false)]; // newest first
  const b = readingBand(answers)!;
  assert.equal(b.samples, 80);
  assert.deepEqual([b.low, b.mid, b.high], [6.5, 7, 7.5]); // 70/80 = 35/40
  assert.equal(readingBand([]), null);
});

test("Writing counts Task 2 twice; Speaking is a plain mean; both ±1", () => {
  const w = writingBand([{ band: 7, task2: true }, { band: 5.5, task2: false }])!; // (14 + 5.5) / 3 = 6.5
  assert.deepEqual([w.low, w.mid, w.high], [5.5, 6.5, 7.5]);
  assert.equal(writingBand(Array(9).fill({ band: 6, task2: false }))!.samples, 5);
  assert.deepEqual(speakingBand([6, 6, 5]), { mid: 5.5, low: 4.5, high: 6.5, samples: 3 });
  assert.equal(speakingBand([]), null);
});

test("lowest section is the lowest midpoint among sections with data", () => {
  const r = (mid: number, samples = 80) => ({ mid, low: mid - 1, high: mid + 1, samples });
  assert.equal(lowestSection({ reading: r(7), writing: r(5.5, 3), speaking: r(6, 5), listening: null }), "writing");
  assert.equal(lowestSection({ reading: null }), null);
  // too little data to count as lowest: 2 Reading answers, 1 Writing task
  assert.equal(lowestSection({ reading: r(2.5, 2), writing: r(4, 1), speaking: r(6, 3) }), "speaking");
});

test("streak counts consecutive WIB practice days, allowing today to be pending", () => {
  const now = new Date("2026-11-18T18:00:00Z"); // 01:00 WIB on the 19th
  assert.equal(wibDay(now), "2026-11-19");
  assert.equal(streakDays(["2026-11-19", "2026-11-18", "2026-11-17"], now), 3);
  assert.equal(streakDays(["2026-11-18", "2026-11-17"], now), 2);   // nothing yet today: still counts
  assert.equal(streakDays(["2026-11-17"], now), 0);                 // a missed day breaks it
  assert.equal(streakDays([], now), 0);
});
