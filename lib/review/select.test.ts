import { test } from "node:test";
import assert from "node:assert/strict";
import { drillFormat, dueSoon, pickDue, speakingDrillPassed, startOfDayWIB, type DueCard } from "./select.ts";
import { fluencyMetrics } from "../speaking/metrics.ts";

const now = new Date("2026-11-18T10:00:00Z");
const card = (patternId: string, dueInHours: number, retrievability: number): DueCard =>
  ({ patternId, dueAt: new Date(now.getTime() + dueInHours * 3_600_000), retrievability });

test("at most 2 due patterns, lowest retrievability first; not-yet-due ones wait", () => {
  const cards = [card("A", -5, 0.8), card("B", -1, 0.2), card("C", -30, 0.5), card("D", +3, 0)];
  assert.deepEqual(pickDue(cards, new Set(), now).map(c => c.patternId), ["B", "C"]);
});

test("patterns reviewed today count towards the cap, so a backlog drains 2 per day", () => {
  const cards = [card("A", -5, 0.8), card("B", -1, 0.2), card("C", -30, 0.5)];
  assert.deepEqual(pickDue(cards, new Set(["B"]), now).map(c => c.patternId), ["C"]);
  assert.deepEqual(pickDue(cards, new Set(["B", "X"]), now), []);
});

test("drills are prepared for cards due within 2 days", () => {
  assert.deepEqual(dueSoon([card("A", -1, 0), card("B", 47, 0), card("C", 49, 0)], now).map(c => c.patternId), ["A", "B"]);
});

test("'today' starts at midnight WIB, not UTC", () => {
  assert.equal(startOfDayWIB(new Date("2026-11-18T18:30:00Z")).toISOString(), "2026-11-18T17:00:00.000Z"); // 01:30 WIB on the 19th
  assert.equal(startOfDayWIB(new Date("2026-11-18T10:00:00Z")).toISOString(), "2026-11-17T17:00:00.000Z"); // 17:00 WIB on the 18th
});

test("drill format follows the pattern type", () => {
  assert.equal(drillFormat("FC.fillers"), "speaking");
  assert.equal(drillFormat("R.word-limit"), "completion");
  assert.equal(drillFormat("R.false-vs-not-given"), "tfng");
  assert.equal(drillFormat("GRA.articles"), "mcq");
  assert.equal(drillFormat("TA.tone"), "mcq");
});

test("speaking drills pass when the timing no longer shows the pattern", () => {
  const words = (n: number, filler = 0) => Array.from({ length: n }, (_, i) => ({ word: i < filler ? "um" : "word", start: i * 0.4, end: i * 0.4 + 0.3 }));
  assert.equal(speakingDrillPassed("FC.fillers", fluencyMetrics(words(40, 6))), false); // 15 per 100 words
  assert.equal(speakingDrillPassed("FC.fillers", fluencyMetrics(words(40, 1))), true);
  assert.equal(speakingDrillPassed("FC.short-answers", fluencyMetrics(words(10))), false);
  assert.equal(speakingDrillPassed("FC.short-answers", fluencyMetrics(words(30))), true);
});
