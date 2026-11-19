// Writing scoring: Task 1 letter (TA, CC, LR, GRA) and Task 2 essay (TR, CC, LR, GRA). Shared logic in lib/scoring.ts.
import { coachFeedback, parseCriterionScores, patternList, type Chat } from "../scoring.ts";

export type WritingKind = "writing_t1" | "writing_t2";

export const WRITING = {
  writing_t1: { label: "Task 1", minWords: 150, criteria: ["TA", "CC", "LR", "GRA"] },
  writing_t2: { label: "Task 2", minWords: 250, criteria: ["TR", "CC", "LR", "GRA"] },
} as const;

export const CRITERION_NAMES: Record<string, string> = {
  TA: "Task Achievement", TR: "Task Response", CC: "Coherence & Cohesion", LR: "Lexical Resource", GRA: "Grammatical Range & Accuracy",
};

export const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Patterns code can see without the LLM: being under the word limit. */
export function lengthPatterns(kind: WritingKind, words: number) {
  const min = WRITING[kind].minWords;
  return words < min ? [{ id: "TR.under-length", note: `${words} kata; minimal ${min}` }] : [];
}

const SCORER: Record<WritingKind, string> = {
  writing_t1: `- TA (Task Achievement): covers all three bullet points fully, clear purpose, tone and register right for
  the recipient (formal to a company or manager, informal to a friend), at least 150 words.`,
  writing_t2: `- TR (Task Response): answers every part of the question, a clear position held throughout, main ideas
  extended and supported, at least 250 words.`,
};

export async function scoreWriting(chat: Chat, kind: WritingKind, task: string, text: string) {
  const criteria = WRITING[kind].criteria;
  const system = `You are a certified IELTS Writing examiner. Score ONE IELTS General Training Writing ${WRITING[kind].label}
response on four criteria, each 0-9 in 0.5 steps, using the public IELTS Writing band descriptors:
${SCORER[kind]}
- CC (Coherence and Cohesion): logical organisation, paragraphing, linking words used accurately, referencing.
- LR (Lexical Resource): range, precision, collocation, spelling, word formation.
- GRA (Grammatical Range and Accuracy): range of structures, complex sentences, frequency of errors, punctuation.
The word count is ${countWords(text)}. Respond with JSON only:
{${criteria.map(c => `"${c}":{"band":6,"reason":"..."}`).join(",")}}`;
  return parseCriterionScores(await chat(system, `Task:\n${task}\n\nResponse:\n${text}`), criteria);
}

export function writingFeedback(chat: Chat, kind: WritingKind, task: string, text: string, scores: Awaited<ReturnType<typeof scoreWriting>>) {
  return coachFeedback(chat, { what: "Writing", criteria: WRITING[kind].criteria, patterns: patternList("writing"), task, text, scores });
}
