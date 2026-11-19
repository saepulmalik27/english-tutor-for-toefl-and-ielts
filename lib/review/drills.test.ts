import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDrills } from "./drills.ts";
import { patternById } from "../patterns/taxonomy.ts";

const mcq = (answer: string) => ({ instructions: "Choose the correct sentence.", prompt: "Pick one", options: ["a", "b", "c", "d"], answer, explanation: "Karena ..." });
const stub = (...replies: unknown[]) => { const r = replies.map(x => JSON.stringify(x)); return async () => r.shift()!; };

test("a drill set is kept only when the checker agrees on all three", async () => {
  const p = patternById("GRA.articles")!;
  const gen = { questions: [mcq("a"), mcq("b"), mcq("c")] };
  const ok = await generateDrills(stub(gen, { answers: [{ n: 1, answer: "a" }, { n: 2, answer: "b" }, { n: 3, answer: "c" }] }), p);
  assert.ok(ok.ok && ok.format === "mcq" && ok.drills.length === 3);
  const bad = await generateDrills(stub(gen, { answers: [{ n: 1, answer: "a" }, { n: 2, answer: "d" }, { n: 3, answer: "c" }] }), p);
  assert.deepEqual(bad, { ok: false, reason: "1 of 3 drills failed the quality check" });
});

test("TFNG drills get the fixed options even if the model forgets them", async () => {
  const tf = (answer: string) => ({ prompt: "Text...\n\nStatement: X", options: null, answer, explanation: "e" });
  const res = await generateDrills(stub({ questions: [tf("TRUE"), tf("FALSE"), tf("NOT GIVEN")] },
    { answers: [{ n: 1, answer: "TRUE" }, { n: 2, answer: "FALSE" }, { n: 3, answer: "NOT GIVEN" }] }), patternById("R.false-vs-not-given")!);
  assert.ok(res.ok);
  assert.deepEqual(res.ok && res.drills[0].options, ["TRUE", "FALSE", "NOT GIVEN"]);
});

test("speaking drills skip the answer check (one LLM call)", async () => {
  let calls = 0;
  const chat = async () => { calls++; return JSON.stringify({ questions: [{ prompt: "Q1" }, { prompt: "Q2" }, { prompt: "Q3" }] }); };
  const res = await generateDrills(chat, patternById("FC.fillers")!);
  assert.ok(res.ok && res.format === "speaking");
  assert.equal(calls, 1);
});
