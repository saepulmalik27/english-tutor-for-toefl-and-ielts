// The only module that talks to AI providers (PRD v2). Configured entirely from env:
//   AI_CHAT_*      primary chat model (Groq gpt-oss-120b)
//   AI_FALLBACK_*  used on 429/5xx from the primary (Cloudflare Workers AI gpt-oss-120b)
//   AI_STT_*       speech-to-text (Groq whisper-large-v3), no fallback
// *_PROVIDER is a LangChain initChatModel provider id (default "openai", i.e. any OpenAI-compatible API).
import { initChatModel } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "./db.ts";
import { createSerialQueue, rateLimitHeaders, withFallback } from "./ai-fallback.ts";

export interface feedbackResult {
  score: number;
  ieltsBand: number;
  toeflScore: number;
  feedback: string;
}

const env = (key: string) => process.env[key]?.trim() || undefined;

async function saveQuota(source: string, headers: Headers) {
  const found = rateLimitHeaders(headers);
  if (!found) return;
  await db.aiQuota
    .upsert({ where: { source }, update: { headers: found }, create: { source, headers: found } })
    .catch(err => console.error("Saving AI quota failed:", err));
}

// Wraps fetch so every provider response updates the stored quota.
const quotaFetch = (source: string): typeof fetch => async (input, init) => {
  const res = await fetch(input, init);
  await saveQuota(source, res.headers);
  return res;
};

type Slot = "chat" | "fallback";
const models = new Map<Slot, ReturnType<typeof initChatModel> | null>();

function model(slot: Slot) {
  if (!models.has(slot)) {
    const prefix = slot === "chat" ? "AI_CHAT" : "AI_FALLBACK";
    const name = env(`${prefix}_MODEL`);
    models.set(slot, name ? initChatModel(name, {
      modelProvider: env(`${prefix}_PROVIDER`) ?? "openai",
      apiKey: env(`${prefix}_API_KEY`),
      temperature: 0.2,
      // Primary fails fast so a 429 goes straight to the fallback instead of 6 backoff retries.
      maxRetries: slot === "chat" ? 0 : 2,
      configuration: { baseURL: env(`${prefix}_BASE_URL`), fetch: quotaFetch(slot) },
    }) : null);
  }
  return models.get(slot)!;
}

const serial = createSerialQueue();

/**
 * One system + user turn, returns the model's text.
 * `serial: true` queues the call behind other serial calls (use for scoring, to stay under Groq's TPM).
 */
export async function chat(system: string, user: string, opts: { serial?: boolean } = {}): Promise<string> {
  const primary = model("chat");
  if (!primary) throw new Error("AI_CHAT_MODEL is not set");
  const fallback = model("fallback");
  const messages = [new SystemMessage(system), new HumanMessage(user)];
  const call = (m: NonNullable<typeof primary>) => async () => {
    const res = await (await m).invoke(messages);
    return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  };
  const run = () => withFallback(call(primary), fallback ? call(fallback) : null);
  return opts.serial ? serial(run) : run();
}

/** Parses a JSON reply, tolerating ```json fences. Throws on malformed JSON. */
export function parseJson<T>(text: string): T {
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as T;
}

export interface Transcript {
  text: string;
  words: { word: string; start: number; end: number }[];
}

/** Speech-to-text with word timestamps. No fallback: on failure the Learner records again. */
export async function transcribe(audio: Blob, filename = "answer.webm"): Promise<Transcript> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", env("AI_STT_MODEL") ?? "whisper-large-v3");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  const res = await fetch(`${env("AI_STT_BASE_URL") ?? "https://api.groq.com/openai/v1"}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("AI_STT_API_KEY")}` },
    body: form,
  });
  await saveQuota("stt", res.headers);
  if (!res.ok) throw new Error(`Transcription failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { text: string; words?: Transcript["words"] };
  return { text: data.text, words: data.words ?? [] };
}

/** v1 writing evaluation, now through chat(). Scales are replaced in the Writing ticket. */
export async function evaluateWriting(text: string, prompt: string): Promise<feedbackResult> {
  const system = `You are a professional native English tutor assisting Indonesian native speakers.
Analyze the user's English writing response to the prompt: "${prompt}".
Provide:
1. A grammar correctness score out of 100.
2. Estimated IELTS Writing Band (Float, 4.0 to 9.0, e.g. 6.5).
3. Estimated TOEFL Writing Score (Int, 8 to 30).
4. Detailed, encouraging feedback written in INDONESIAN language. Highlight grammatical mistakes, give exact corrections, explain the grammar rules in Indonesian, and suggest 3 better vocabulary words with their Indonesian translations.

You MUST respond strictly with a JSON object in this exact format (no surrounding explanation, just JSON):
{
  "score": number,
  "ieltsBand": number,
  "toeflScore": number,
  "feedback": "string (Markdown format in Indonesian)"
}`;
  const result = parseJson<Partial<feedbackResult>>(
    await chat(system, `Prompt: "${prompt}"\nUser Submission: "${text}"`, { serial: true })
  );
  return {
    score: Number(result.score) || 60,
    ieltsBand: Number(result.ieltsBand) || 5.0,
    toeflScore: Number(result.toeflScore) || 15,
    feedback: String(result.feedback),
  };
}
