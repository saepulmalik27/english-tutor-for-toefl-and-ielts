import { test } from "node:test";
import assert from "node:assert/strict";
import { countWords, lengthPatterns, scoreWriting, writingFeedback } from "./score.ts";

test("under-length writing raises TR.under-length from code", () => {
  assert.deepEqual(lengthPatterns("writing_t1", 120).map(p => p.id), ["TR.under-length"]);
  assert.deepEqual(lengthPatterns("writing_t1", 150), []);
  assert.deepEqual(lengthPatterns("writing_t2", 249).map(p => p.note), ["249 kata; minimal 250"]);
  assert.equal(countWords("  Dear  Sir,\nI am writing. "), 5);
});

test("Task 1 is scored on TA and Task 2 on TR, then Feedback is a separate call with Writing patterns", async () => {
  const prompts: string[] = [];
  const reply = (r: string) => async (system: string) => { prompts.push(system); return r; };
  const t1 = await scoreWriting(reply('{"TA":{"band":6},"CC":{"band":6},"LR":{"band":5.5},"GRA":{"band":5}}'), "writing_t1", "Write a letter", "Dear Sir");
  assert.deepEqual(Object.keys(t1), ["TA", "CC", "LR", "GRA"]);
  await assert.rejects(scoreWriting(reply('{"TA":{"band":6},"CC":{"band":6},"LR":{"band":6},"GRA":{"band":6}}'), "writing_t2", "Essay", "x"), /missing TR/);

  const fb = await writingFeedback(reply('{"summary":"s","criteria":{"TA":"a","CC":"b","LR":"c","GRA":"d"},"patterns":[{"id":"TA.tone","quote":"Hey dude"}]}'),
    "writing_t1", "Write a letter", "Hey dude", t1);
  assert.equal(fb.patterns[0].id, "TA.tone");
  assert.match(prompts.at(-1)!, /TA\.tone/);          // Writing-only patterns are offered...
  assert.doesNotMatch(prompts.at(-1)!, /FC\.fillers/); // ...Speaking-only ones are not
});
