import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScores, scoreSpeaking, speakingFeedback } from "./score.ts";
import { fluencyMetrics } from "./metrics.ts";

test("scores are clamped to 0-9 in half bands; every criterion is required", () => {
  const s = parseScores('{"FC":{"band":6.3,"reason":"a"},"LR":{"band":"7"},"GRA":{"band":11}}');
  assert.deepEqual([s.FC.band, s.LR.band, s.GRA.band], [6.5, 7, 9]);
  assert.throws(() => parseScores('{"FC":{"band":6},"LR":{"band":6}}'), /missing GRA/);
  assert.throws(() => parseScores('{"FC":{"band":"six"},"LR":{"band":6},"GRA":{"band":6}}'), /not a number/);
});

test("scoring and Feedback are two separate calls; Feedback sees the final scores", async () => {
  const calls: string[] = [];
  const chat = async (system: string, user: string) => {
    calls.push(user);
    return calls.length === 1
      ? '{"FC":{"band":6,"reason":"r"},"LR":{"band":6.5,"reason":"r"},"GRA":{"band":5.5,"reason":"r"}}'
      : '{"summary":"Bagus","criteria":{"FC":"a","LR":"b","GRA":"c"}}';
  };
  const scores = await scoreSpeaking(chat, "Describe a tool", "I use my laptop", fluencyMetrics([]));
  const fb = await speakingFeedback(chat, "Describe a tool", "I use my laptop", scores);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /Fluency metrics/);
  assert.match(calls[1], /"band":5.5/);
  assert.equal(fb.criteria.GRA, "c");
});

test("Part 2 items need at least three bullets; other parts drop bullets", async () => {
  const { parseSpeakingItems } = await import("../questions/prompts.ts");
  const p2 = parseSpeakingItems("speaking_p2", '{"items":[{"prompt":"Describe a tool","bullets":["what","when","how","and explain why"]},{"prompt":"Describe a place","bullets":["what"]}]}');
  assert.deepEqual(p2.map(i => i.prompt), ["Describe a tool"]);
  const prefixed = parseSpeakingItems("speaking_p2", '{"items":[{"prompt":"Describe a trip","bullets":["You should say where","You should say: when","how","and explain why"]}]}');
  assert.deepEqual(prefixed[0].bullets, ["where", "when", "how", "and explain why"]);
  const p1 = parseSpeakingItems("speaking_p1", '{"items":[{"prompt":"Do you work?","bullets":["x"]},{"prompt":""}]}');
  assert.deepEqual(p1, [{ prompt: "Do you work?", bullets: null }]);
});
