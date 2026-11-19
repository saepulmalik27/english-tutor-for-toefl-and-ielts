import { test } from "node:test";
import assert from "node:assert/strict";
import { Rating } from "ts-fsrs";
import { drillRating, parsePatternTags, readingPattern, recordOccurrence, retrievability, reviveCard } from "./cards.ts";
import { PATTERNS } from "./taxonomy.ts";

const day = (n: number) => new Date(Date.UTC(2026, 10, 18 + n, 10));

test("taxonomy has about 35 unique patterns, each with a skill and criterion", () => {
  assert.ok(PATTERNS.length >= 30 && PATTERNS.length <= 40);
  assert.equal(new Set(PATTERNS.map(p => p.id)).size, PATTERNS.length);
  assert.ok(PATTERNS.every(p => p.skill && p.criterion && p.name && p.hint));
});

test("first occurrence creates a new card; a later occurrence is rated Again", async () => {
  const created = await recordOccurrence(null, day(0));
  assert.equal(created.reps, 0);
  assert.equal(created.scheduleStatus, "new");
  const again = await recordOccurrence(created, day(1));
  assert.equal(again.reps, 1);
  assert.ok(again.lastReviewAt);
  const lapsed = await recordOccurrence(again, day(5));
  assert.ok(lapsed.difficulty >= again.difficulty, "repeated Again never makes a pattern easier");
});

test("drill results map to Again / Hard / Good, never Easy", () => {
  assert.equal(drillRating(0), Rating.Again);
  assert.equal(drillRating(1), Rating.Again);
  assert.equal(drillRating(2), Rating.Hard);
  assert.equal(drillRating(3), Rating.Good);
});

test("retrievability: never reviewed is 0, then it decays over time", async () => {
  const c = await recordOccurrence(null, day(0));
  assert.equal(await retrievability(c, day(0)), 0);
  const reviewed = await recordOccurrence(c, day(0));
  const soon = await retrievability(reviewed, day(0));
  const later = await retrievability(reviewed, day(10));
  assert.ok(soon > later && later > 0);
});

test("cards survive a JSON round trip through the database", async () => {
  const c = await recordOccurrence(await recordOccurrence(null, day(0)), day(1));
  const revived = reviveCard(JSON.parse(JSON.stringify(c)));
  assert.ok(revived.dueAt instanceof Date);
  const next = await recordOccurrence(revived, day(3));
  assert.equal(next.reps, 2);
});

test("LLM tags: unknown IDs fall to 'other' with the ID kept; malformed JSON is rejected", () => {
  const tags = parsePatternTags('```json\n{"patterns":[{"id":"GRA.articles","quote":"a office"},{"id":"GRA.made-up","note":"odd"}]}\n```');
  assert.deepEqual(tags.map(t => t.id), ["GRA.articles", "other"]);
  assert.equal(tags[1].note, "GRA.made-up: odd");
  assert.throws(() => parsePatternTags("{not json"));
  assert.throws(() => parsePatternTags('{"answers":[]}'), /no patterns array/);
});

test("wrong Reading answers are tagged from the question type", () => {
  const tfng = { type: "tfng", answer: "FALSE", instructions: null };
  assert.equal(readingPattern(tfng, "NOT GIVEN"), "R.false-vs-not-given");
  assert.equal(readingPattern(tfng, "TRUE"), "R.paraphrase");
  assert.equal(readingPattern({ type: "matching_headings", answer: "iv X", instructions: null }, "ii Y"), "R.heading-detail");
  assert.equal(readingPattern({ type: "matching_features", answer: "A", instructions: null }, "B"), "R.matching-scan");
  const gap = { type: "sentence_completion", answer: "pullet", instructions: "Choose NO MORE THAN TWO WORDS" };
  assert.equal(readingPattern(gap, "a young female hen"), "R.word-limit");
  assert.equal(readingPattern(gap, "hen"), "R.detail");
});

test("transcript is split into highlighted segments at each tag's quote", async () => {
  const { segmentTranscript } = await import("./cards.ts");
  const t = "Yesterday I go to a office and I go home.";
  const { segments, unplaced } = segmentTranscript(t, [
    { id: "GRA.articles", quote: "a office" },
    { id: "GRA.tense-form", quote: "I go" },
    { id: "GRA.tense-form", quote: "I go" },        // second occurrence, matched after the first
    { id: "LR.word-choice", quote: "not in text" },
  ]);
  assert.deepEqual(segments.map(s => (typeof s === "string" ? s : `[${s.text}]`)).join(""), "Yesterday [I go] to [a office] and [I go] home.");
  assert.deepEqual(unplaced.map(u => u.id), ["LR.word-choice"]);
});
