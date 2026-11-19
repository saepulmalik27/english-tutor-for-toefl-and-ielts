// Generates 3 fresh drills for one Error Pattern (PRD v2). Non-speaking drills pass the same quality check
// as Reading questions: a second LLM call answers them from the question text alone.
import { parseJson } from "../json.ts";
import { acceptQuestions, checkPrompt, normalizeQuestion, TFNG_OPTIONS, type Chat, type GeneratedQuestion } from "../questions/pipeline.ts";
import type { ErrorPattern } from "../patterns/taxonomy.ts";
import { drillFormat, DRILLS_PER_PATTERN, type DrillFormat } from "./select.ts";

const FORMAT: Record<DrillFormat, string> = {
  mcq: `Multiple choice: "prompt" is one short task (e.g. "Choose the correct sentence." with the sentences as options,
or a sentence with a gap "____" and word choices). "options" has exactly 4 items; "answer" is the one correct
option copied exactly. Only one option may be defensible.`,
  tfng: `A short text of 60-100 words followed by one statement. "prompt" is the text, a blank line, then
"Statement: ...". "options" is exactly ["TRUE","FALSE","NOT GIVEN"]; "answer" is one of them.`,
  completion: `A short text of 60-100 words followed by one sentence with a gap "____" to complete with words copied
from the text. "instructions" is "Choose NO MORE THAN TWO WORDS from the text." "options" is null; "answer"
is the words (optional words in brackets, alternatives separated by "|").`,
  speaking: `A short IELTS Speaking question (Part 1 style) that makes the learner practise this exact weakness.
"options", "answer" and "explanation" are null.`,
};

export async function generateDrills(chat: Chat, pattern: ErrorPattern):
  Promise<{ ok: true; format: DrillFormat; drills: GeneratedQuestion[] } | { ok: false; reason: string }> {
  const format = drillFormat(pattern.id);
  const system = `You write ${DRILLS_PER_PATTERN} short practice drills for an Indonesian IELTS learner who keeps making this
mistake: "${pattern.name}" — ${pattern.hint}
Each drill must target exactly this mistake. Use everyday or work topics.
${FORMAT[format]}
The drill itself (prompt, any text, options, answer) is in ENGLISH: it is English practice.
Only "explanation" is in Bahasa Indonesia: why the answer is right.
Respond with JSON only: {"questions":[{"type":"${format}","instructions":"...","prompt":"...","options":...,"answer":"...","explanation":"..."}]}`;
  const reply = parseJson<{ questions?: Record<string, unknown>[] }>(await chat(system, `Write ${DRILLS_PER_PATTERN} drills.`));
  const drills = (reply.questions ?? []).map(q => normalizeQuestion({ ...q, type: format }));
  if (drills.length !== DRILLS_PER_PATTERN) return { ok: false, reason: `expected ${DRILLS_PER_PATTERN} drills, got ${drills.length}` };

  if (format === "speaking") {
    return drills.every(d => d.prompt) ? { ok: true, format, drills } : { ok: false, reason: "empty speaking prompt" };
  }
  if (format === "tfng") drills.forEach(d => { d.options = TFNG_OPTIONS; });

  const { system: checker, items } = checkPrompt(drills);
  const { answers } = parseJson<{ answers?: { n: number; answer: string; ambiguous?: boolean }[] }>(
    await chat(checker, `Passage: (none; each question contains its own text)\n\nQuestions:\n${items}`)
  );
  const accepted = acceptQuestions(drills, answers ?? [], [format]);
  return accepted.length === DRILLS_PER_PATTERN
    ? { ok: true, format, drills: accepted }
    : { ok: false, reason: `${DRILLS_PER_PATTERN - accepted.length} of ${DRILLS_PER_PATTERN} drills failed the quality check` };
}
