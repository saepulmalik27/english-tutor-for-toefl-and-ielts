// Section 3 question generation + quality check (PRD v2, ticket 05).
// No DB or LangChain imports: the `chat` function is passed in, so tests can stub the LLM.
import { parseJson } from "../json.ts";
import { countWords, isCorrect, wordLimit } from "./answers.ts";

export const SECTION3_TYPES = [
  "tfng", "matching_headings", "matching_information", "matching_features",
  "sentence_completion", "note_completion", "summary_completion", "short_answer",
] as const;
export type QuestionType = (typeof SECTION3_TYPES)[number];

export const TFNG_OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];
const COUNTS = [5, 4, 4]; // 13 questions across 3 types, like a real Section 3

export interface GeneratedQuestion {
  type: QuestionType;
  instructions: string;
  prompt: string;
  options: string[] | null; // null = typed answer
  answer: string;           // for options: the exact option text; for typed: words from the passage, "|" for alternatives
  explanation: string;      // Indonesian
}

export type Chat = (system: string, user: string) => Promise<string>;

/** Paragraph letters, as in IELTS: the reader shows the same letters (A, B, C, ...). */
export const paragraphLetter = (i: number) => String.fromCharCode(65 + i);

/** Passage text for the LLM, with each paragraph prefixed by its letter. */
export function letteredPassage(title: string, body: string): string {
  const paras = body.split(/\n{2,}/).map((p, i) => `${paragraphLetter(i)}\n${p}`);
  return `Passage: ${title}\n\n${paras.join("\n\n")}`;
}

/** 3 distinct types, chosen by code so only their examples go into the prompt. */
export function pickTypes(rand: () => number = Math.random): QuestionType[] {
  const pool = [...SECTION3_TYPES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

export function generationPrompt(types: QuestionType[], examples: (t: QuestionType) => string) {
  const plan = types.map((t, i) => `- ${COUNTS[i]} questions of type "${t}"`).join("\n");
  const system = `You write original IELTS General Training Reading Section 3 questions for one passage.
Write exactly 13 questions:
${plan}

Rules:
- Every answer must be decidable from the passage alone, with exactly one correct answer.
- "tfng": options exactly ["TRUE","FALSE","NOT GIVEN"]; FALSE contradicts the passage, NOT GIVEN is not covered by it.
- "matching_*": give the full list of choices in "options" on every question of that group; "answer" is one option, copied exactly.
- "matching_headings": the passage paragraphs are lettered A, B, C...; each question's prompt is "Paragraph X". Give 2-3 more headings than questions (distractors) and list them in an order unrelated to the paragraph order.
- Every question has exactly ONE answer. Completion questions contain exactly one gap written "____"; for summary/note completion, write each gap as its own question (one sentence of the summary per question).
- Completion and "short_answer": "options" is null; the answer is copied word for word from the passage, within the word limit stated in "instructions" (e.g. "Choose NO MORE THAN TWO WORDS from the passage for each answer."). Put optional words in (brackets) and alternatives separated by "|".
- "instructions" is the IELTS-style rubric shared by the group.
- "explanation" MUST be written in Bahasa Indonesia (not English): why the answer is right, quoting the passage.

Official examples of these question types (ielts.org, for format only; never copy their content):
${types.map(t => `### ${t}\n${examples(t) || "(no example)"}`).join("\n\n")}

Respond with JSON only: {"questions":[{"type","instructions","prompt","options","answer","explanation"}]}
The "questions" array must contain exactly 13 objects, in the order of the plan above.`;
  return system;
}

export function checkPrompt(questions: GeneratedQuestion[]) {
  const system = `You are checking IELTS Reading questions. Answer each one using ONLY the passage.
For options questions, answer with one option copied exactly (or its letter/numeral). For typed questions, copy the words from the passage.
Set "ambiguous": true when more than one answer could be defended or the passage does not settle it.
Respond with JSON only: {"answers":[{"n":1,"answer":"...","ambiguous":false}]}`;
  const items = questions.map((q, i) =>
    `${i + 1}. [${q.instructions}] ${q.prompt}${q.options ? `\n   Options: ${q.options.join(" / ")}` : ""}`
  ).join("\n");
  return { system, items };
}

/**
 * IELTS matching answers are labels ("A", "iv") while options read "A. Some text".
 * Returns the option the answer stands for (exact text or its label), else the answer unchanged.
 */
export function toOption(answer: string, options: string[] | null): string {
  if (!options || options.includes(answer)) return answer;
  const label = answer.trim().replace(/[.)]$/, "").toLowerCase();
  const hits = options.filter(o => o.match(/^\s*([A-Za-z]+|\d+)[.)]?\s/)?.[1].toLowerCase() === label);
  return hits.length === 1 ? hits[0] : answer;
}

/** LLMs sometimes return answers as numbers or arrays; coerce to the stored shape. */
export function normalizeQuestion(raw: Record<string, unknown>): GeneratedQuestion {
  const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  const options = Array.isArray(raw.options) ? raw.options.map(str) : null;
  const answer = Array.isArray(raw.answer) ? raw.answer.map(str).join("|") : str(raw.answer);
  return {
    type: str(raw.type) as QuestionType,
    instructions: str(raw.instructions),
    prompt: str(raw.prompt),
    options,
    answer: toOption(answer, options),
    explanation: str(raw.explanation),
  };
}

/** Structural problems that make a generated question unusable, or null when it is well formed. */
export function structuralProblem(q: GeneratedQuestion, types: readonly string[]): string | null {
  if (!types.includes(q.type)) return `unexpected type ${q.type}`;
  if (!q.prompt?.trim() || !q.answer?.trim() || !q.explanation?.trim()) return "missing field";
  if (q.type === "tfng" && JSON.stringify(q.options) !== JSON.stringify(TFNG_OPTIONS)) return "bad TFNG options";
  if (q.options && !q.options.includes(q.answer)) return "answer not among options";
  if (!q.options) {
    if ((q.prompt.match(/_{3,}/g) ?? []).length > 1) return "more than one gap";
    const limit = wordLimit(q.instructions);
    const tooLong = q.answer.split("|").some(a => limit !== null && countWords(a.replace(/\([^)]*\)/g, "")) > limit);
    if (tooLong) return "answer exceeds word limit";
  }
  return null;
}

/** Questions the checker answered the same way as the key, without flagging ambiguity. */
export function acceptQuestions(
  questions: GeneratedQuestion[],
  checked: { n: number; answer: string; ambiguous?: boolean }[],
  types: readonly string[]
) {
  return questions.filter((q, i) => {
    const c = checked.find(a => a.n === i + 1);
    return !structuralProblem(q, types) && c && !c.ambiguous && isCorrect(toOption(String(c.answer ?? ""), q.options), q.answer);
  });
}

/**
 * Generates 13 questions for a passage and keeps the set only if every question passes the check.
 * Returns the questions, or a reason when the set is rejected (the caller retries on a later run).
 */
export async function generateQuestionSet(
  passage: { title: string; body: string },
  chat: Chat,
  examples: (t: QuestionType) => string,
  rand?: () => number
): Promise<{ ok: true; questions: GeneratedQuestion[] } | { ok: false; reason: string }> {
  const types = pickTypes(rand);
  const passageText = letteredPassage(passage.title, passage.body);
  const reply = parseJson<{ questions?: Record<string, unknown>[] }>(
    await chat(generationPrompt(types, examples), passageText)
  );
  const questions = (reply.questions ?? []).map(normalizeQuestion);
  if (questions.length !== 13) return { ok: false, reason: `expected 13 questions, got ${questions.length}` };

  const { system, items } = checkPrompt(questions);
  const { answers } = parseJson<{ answers: { n: number; answer: string; ambiguous?: boolean }[] }>(
    await chat(system, `${passageText}\n\nQuestions:\n${items}`)
  );
  const accepted = acceptQuestions(questions, answers ?? [], types);
  return accepted.length === 13
    ? { ok: true, questions: accepted }
    : { ok: false, reason: `${13 - accepted.length} of 13 questions failed the quality check` };
}
