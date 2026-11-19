import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrect, wordLimit } from "./answers.ts";

test("optional bracketed words may be included or left out", () => {
  assert.ok(isCorrect("Retailing Manager", "(the) Retailing Manager"));
  assert.ok(isCorrect("the retailing manager", "(the) Retailing Manager"));
  assert.ok(!isCorrect("manager", "(the) Retailing Manager"));
});

test("alternatives separated by | are all accepted", () => {
  assert.ok(isCorrect("negatives", "(photographic) film|negative(s)"));
  assert.ok(isCorrect("photographic film", "(photographic) film|negative(s)"));
});

test("case, punctuation and spacing don't matter; empty answers never match", () => {
  assert.ok(isCorrect("  NOT   given. ", "NOT GIVEN"));
  assert.ok(isCorrect("$50000", "$50,000")); // thousands separators don't matter
  assert.ok(!isCorrect("", "TRUE"));
});

test("word limits are read from the IELTS rubric", () => {
  assert.equal(wordLimit("Choose NO MORE THAN TWO WORDS from the passage for each answer."), 2);
  assert.equal(wordLimit("Choose NO MORE THAN THREE WORDS AND/OR A NUMBER"), 3);
  assert.equal(wordLimit("Choose ONE WORD ONLY from the passage for each answer."), 1);
  assert.equal(wordLimit("Write TRUE, FALSE or NOT GIVEN"), null);
});
