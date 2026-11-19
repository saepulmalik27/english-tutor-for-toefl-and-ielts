// Generates original IELTS Speaking and Writing prompts from the official task descriptions (no official
// material). Bullets (Speaking Part 2 cue card, Writing Task 1 letter points) go in Question.options.
import { parseJson } from "../json.ts";

export type SpeakingKind = "speaking_p1" | "speaking_p2" | "speaking_p3";
export type PromptKind = SpeakingKind | "writing_t1" | "writing_t2";
export interface SpeakingItem { prompt: string; bullets: string[] | null }
export type Chat = (system: string, user: string) => Promise<string>;

// Kinds whose items must come with (at least three) bullets.
const NEEDS_BULLETS = new Set<PromptKind>(["speaking_p2", "writing_t1"]);

const TASK: Record<PromptKind, string> = {
  speaking_p1: `IELTS Speaking Part 1: short questions about familiar everyday topics (work or study, home,
hobbies, daily routine, technology use, food, travel). Each item is ONE question, answered in 20-40 seconds.`,
  speaking_p2: `IELTS Speaking Part 2 cue cards: "Describe ..." with exactly three "You should say" bullets and a
final "and explain ..." bullet. The candidate prepares 1 minute and speaks 1-2 minutes.`,
  speaking_p3: `IELTS Speaking Part 3: abstract discussion questions that ask the candidate to compare, evaluate,
speculate or explain causes (society, work, technology, education, environment). Each item is ONE question.`,
  writing_t1: `IELTS General Training Writing Task 1: a letter (at least 150 words) for a realistic everyday or
work situation. "prompt" describes the situation, says who the letter is to (a friend, a manager, a company,
a council...) so the register is clear, and ends with "Write a letter to ..."; "bullets" are exactly three
points the letter must cover ("In your letter ..." is shown by the app). Put "Begin your letter as follows:
Dear ...," at the end of "prompt".`,
  writing_t2: `IELTS General Training Writing Task 2: an essay question (at least 250 words) on a general
topic, in one of the usual forms: agree/disagree, discuss both views and give your opinion, advantages and
disadvantages, or problem and solution. "prompt" is the full question including the instruction line.`,
};

export function parseSpeakingItems(kind: PromptKind, text: string): SpeakingItem[] {
  const { items } = parseJson<{ items?: { prompt?: unknown; bullets?: unknown }[] }>(text);
  return (items ?? [])
    .map(i => ({
      prompt: String(i.prompt ?? "").trim(),
      // The UI prints "You should say:" once; drop it if the model repeats it on every bullet.
      bullets: Array.isArray(i.bullets) ? i.bullets.map(b => String(b).replace(/^you should say:?\s*/i, "").trim()).filter(Boolean) : null,
    }))
    .filter(i => i.prompt && (!NEEDS_BULLETS.has(kind) || (i.bullets?.length ?? 0) >= 3))
    .map(i => (NEEDS_BULLETS.has(kind) ? i : { ...i, bullets: null }));
}

export async function generateSpeakingItems(chat: Chat, kind: PromptKind, count: number) {
  const system = `You write original practice items for the IELTS General Training ${kind.startsWith("writing") ? "Writing" : "Speaking"} test.
${TASK[kind]}
Vary the topics; never copy official IELTS material. Respond with JSON only:
{"items":[{"prompt":"...","bullets":${NEEDS_BULLETS.has(kind) ? '["...","...","..."]' : "null"}}]}`;
  return parseSpeakingItems(kind, await chat(system, `Write ${count} items.`)).slice(0, count);
}
