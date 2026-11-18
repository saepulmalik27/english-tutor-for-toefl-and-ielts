import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanExtract, cutToLength, wordCount } from "./wikipedia-text.ts";

const words = (n: number, w = "word") => Array(n).fill(w).join(" ");

// Shaped like a real `prop=extracts&explaintext=1` response.
const fixture = [
  words(300, "lead"),
  "",
  "",
  "== Habitat ==",
  words(300, "habitat"),
  "",
  "=== Range ===",
  words(250, "range"),
  "",
  "== References ==",
  "Smith, J. (2001). A citation.",
  "",
  "== External links ==",
  "Official site",
].join("\n");

test("cleanExtract drops reference sections and flattens headings", () => {
  const text = cleanExtract(fixture);
  assert.doesNotMatch(text, /References|External links|citation|==/);
  assert.match(text, /\n\nHabitat\nhabitat/);
  assert.match(text, /\n\nRange\nrange/);
  assert.doesNotMatch(text, /\n{3,}/);
});

test("cutToLength keeps whole paragraphs up to the max", () => {
  const cut = cutToLength(cleanExtract(fixture), 500, 700)!;
  // lead (300) + Habitat paragraph (1 + 300) = 601; adding Range (251) would exceed 700.
  assert.equal(cut.wordCount, 601);
  assert.equal(wordCount(cut.body), 601);
  assert.doesNotMatch(cut.body, /range/);
});

test("cutToLength rejects text under the minimum", () => {
  assert.equal(cutToLength(words(650)), null);
});

test("cutToLength keeps an oversized first paragraph instead of returning nothing", () => {
  assert.equal(cutToLength(words(1000))!.wordCount, 1000);
});
