import { test } from "node:test";
import assert from "node:assert/strict";
import { composeSession, daysBetween, weekStart } from "./compose.ts";

const types = (p: ReturnType<typeof composeSession>) => p.blocks.map(b => b.type);
const base = { dayIndex: 10, lowest: null, writingSwapsThisWeek: 0, reviewDue: true } as const;

test("default session: Speaking 15, Reading 9, Review 6", () => {
  const p = composeSession(base);
  assert.deepEqual(types(p), ["speaking", "reading", "review"]);
  assert.equal(p.blocks.reduce((s, b) => s + b.minutes, 0), 30);
});

test("first week rotates through every Skill, with one Task 1 and one Task 2", () => {
  const week = Array.from({ length: 7 }, (_, d) => types(composeSession({ ...base, dayIndex: d, lowest: "writing" }))[1]);
  assert.deepEqual(week, ["reading", "writing_t1", "reading", "writing_t2", "reading", "reading", "reading"]);
});

test("Writing as lowest swaps Task 1 in for Reading, at most twice a week", () => {
  assert.deepEqual(types(composeSession({ ...base, lowest: "writing", writingSwapsThisWeek: 1 })), ["speaking", "writing_t1", "review"]);
  assert.deepEqual(types(composeSession({ ...base, lowest: "writing", writingSwapsThisWeek: 2 })), ["speaking", "reading", "review"]);
  assert.deepEqual(types(composeSession({ ...base, lowest: "reading" })), ["speaking", "reading", "review"]);
});

test("an empty review slot becomes extra practice for the lowest section", () => {
  assert.equal(types(composeSession({ ...base, reviewDue: false, lowest: "speaking" }))[2], "extra_speaking");
  assert.equal(types(composeSession({ ...base, reviewDue: false, lowest: "reading" }))[2], "extra_reading");
  assert.equal(types(composeSession({ ...base, reviewDue: false, lowest: "writing" }))[2], "extra_reading");
});

test("WIB day helpers", () => {
  assert.equal(daysBetween("2026-11-15", "2026-11-18"), 3);
  assert.equal(weekStart("2026-11-18"), "2026-11-16"); // Wednesday → Monday
  assert.equal(weekStart("2026-11-16"), "2026-11-16");
  assert.equal(weekStart("2026-11-22"), "2026-11-16"); // Sunday belongs to the same week
});
