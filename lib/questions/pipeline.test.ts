import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acceptQuestions, generateQuestionSet, pickTypes, structuralProblem,
  TFNG_OPTIONS, type GeneratedQuestion, type QuestionType,
} from "./pipeline.ts";

const TYPES: QuestionType[] = ["tfng", "sentence_completion", "matching_headings"];
const q = (over: Partial<GeneratedQuestion>): GeneratedQuestion => ({
  type: "tfng", instructions: "Write TRUE, FALSE or NOT GIVEN", prompt: "Trees grow.",
  options: TFNG_OPTIONS, answer: "TRUE", explanation: "Karena teks menyebut ...", ...over,
});
const thirteen = () => Array.from({ length: 13 }, (_, i) => q({ prompt: `Statement ${i + 1}` }));

test("passage paragraphs are lettered for matching tasks", async () => {
  const { letteredPassage } = await import("./pipeline.ts");
  assert.equal(letteredPassage("T", "one\n\ntwo"), "Passage: T\n\nA\none\n\nB\ntwo");
});

test("pickTypes returns 3 distinct section 3 types", () => {
  const t = pickTypes(() => 0.42);
  assert.equal(t.length, 3);
  assert.equal(new Set(t).size, 3);
});

test("structural checks catch malformed questions", () => {
  assert.equal(structuralProblem(q({}), TYPES), null);
  assert.match(structuralProblem(q({ options: ["YES", "NO"] }), TYPES)!, /TFNG/);
  assert.match(structuralProblem(q({ type: "short_answer" }), TYPES)!, /unexpected type/);
  assert.match(structuralProblem(q({ options: ["i", "ii"], type: "matching_headings", answer: "iii" }), TYPES)!, /not among options/);
  const tooLong = q({ type: "sentence_completion", options: null, instructions: "NO MORE THAN TWO WORDS", answer: "three whole words" });
  assert.match(structuralProblem(tooLong, TYPES)!, /word limit/);
  const twoGaps = q({ type: "sentence_completion", options: null, instructions: "ONE WORD ONLY", prompt: "First ____ then ____.", answer: "a|b" });
  assert.match(structuralProblem(twoGaps, TYPES)!, /more than one gap/);
  const optionalOk = q({ type: "sentence_completion", options: null, instructions: "NO MORE THAN TWO WORDS", answer: "(the) printing plates" });
  assert.equal(structuralProblem(optionalOk, TYPES), null);
});

test("quality check rejects mismatched and ambiguous answers", () => {
  const qs = [q({ answer: "TRUE" }), q({ answer: "FALSE" }), q({ answer: "NOT GIVEN" })];
  const accepted = acceptQuestions(qs, [
    { n: 1, answer: "TRUE" },
    { n: 2, answer: "NOT GIVEN" },               // checker disagrees with the key
    { n: 3, answer: "NOT GIVEN", ambiguous: true },
  ], TYPES);
  assert.deepEqual(accepted.map(a => a.answer), ["TRUE"]);
});

// Stub LLM: first call generates, second call checks.
const stubChat = (generated: unknown, checked: unknown) => {
  const replies = [JSON.stringify(generated), "```json\n" + JSON.stringify(checked) + "\n```"];
  return async () => replies.shift()!;
};
const fixedTypes = () => 0; // pickTypes(() => 0) is deterministic

test("a set is kept only when all 13 questions pass", async () => {
  const types = pickTypes(fixedTypes);
  const qs = thirteen().map(x => ({ ...x, type: types[0] }));
  // make them valid for whatever type[0] is by using tfng-shaped data only when it is tfng
  const valid = types[0] === "tfng" ? qs : qs.map(x => ({ ...x, options: ["A", "B"], answer: "A" }));
  const allAgree = valid.map((x, i) => ({ n: i + 1, answer: x.answer }));

  const ok = await generateQuestionSet({ title: "T", body: "B" }, stubChat({ questions: valid }, { answers: allAgree }), () => "", fixedTypes);
  assert.equal(ok.ok, true);

  const oneWrong = allAgree.map(a => (a.n === 7 ? { ...a, answer: "something else" } : a));
  const bad = await generateQuestionSet({ title: "T", body: "B" }, stubChat({ questions: valid }, { answers: oneWrong }), () => "", fixedTypes);
  assert.deepEqual(bad, { ok: false, reason: "1 of 13 questions failed the quality check" });
});

test("non-string answers and options are coerced before validation", async () => {
  const { normalizeQuestion } = await import("./pipeline.ts");
  const n = normalizeQuestion({ type: "short_answer", prompt: "How much?", answer: 50, options: undefined, explanation: "x" });
  assert.equal(n.answer, "50");
  assert.equal(n.options, null);
  assert.equal(normalizeQuestion({ answer: ["film", "negatives"] }).answer, "film|negatives");
});

test("matching answers given as labels map to their option", async () => {
  const { toOption, normalizeQuestion } = await import("./pipeline.ts");
  const opts = ["A. Calyptomena whiteheadi", "B. Calyptomena", "iv The LGVs’ main functions"];
  assert.equal(toOption("A", opts), "A. Calyptomena whiteheadi");
  assert.equal(toOption("b.", opts), "B. Calyptomena");
  assert.equal(toOption("iv", opts), "iv The LGVs’ main functions");
  assert.equal(toOption("Z", opts), "Z");
  assert.equal(normalizeQuestion({ type: "matching_features", options: opts, answer: "B" }).answer, "B. Calyptomena");
  const q1 = q({ type: "matching_headings", options: opts, answer: "iv The LGVs’ main functions" });
  assert.equal(acceptQuestions([q1], [{ n: 1, answer: "iv" }], TYPES).length, 1);
});

test("a reply without 13 questions is rejected before the check runs", async () => {
  let calls = 0;
  const chat = async () => { calls++; return JSON.stringify({ questions: [q({})] }); };
  const res = await generateQuestionSet({ title: "T", body: "B" }, chat, () => "", fixedTypes);
  assert.deepEqual(res, { ok: false, reason: "expected 13 questions, got 1" });
  assert.equal(calls, 1);
});
