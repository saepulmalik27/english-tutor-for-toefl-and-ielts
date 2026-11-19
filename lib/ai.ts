// The only module that talks to AI providers (PRD v2). Configured entirely from env:
//   AI_CHAT_*      primary chat model (Groq gpt-oss-120b)
//   AI_FALLBACK_*  used on 429/5xx from the primary (Cloudflare Workers AI gpt-oss-120b)
//   AI_STT_*       speech-to-text (Groq whisper-large-v3), no fallback
// *_PROVIDER is a LangChain initChatModel provider id (default "openai", i.e. any OpenAI-compatible API).
import { initChatModel } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "./db.ts";
import { createSerialQueue, rateLimitHeaders, withFallback } from "./ai-fallback.ts";


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
// The one call both model kinds share.
type Model = { invoke: (messages: (SystemMessage | HumanMessage)[]) => Promise<{ content: unknown }> };
const models = new Map<Slot, Promise<Model> | null>();

function model(slot: Slot) {
  if (!models.has(slot)) {
    const prefix = slot === "chat" ? "AI_CHAT" : "AI_FALLBACK";
    const name = env(`${prefix}_MODEL`);
    const provider = env(`${prefix}_PROVIDER`) ?? "openai";
    const fields = {
      apiKey: env(`${prefix}_API_KEY`),
      temperature: 0.2,
      // Workers AI defaults to 256 tokens, which gpt-oss spends on reasoning before any answer.
      maxTokens: 8192,
      // Primary fails fast so a 429 goes straight to the fallback instead of 6 backoff retries.
      maxRetries: slot === "chat" ? 0 : 2,
      configuration: { baseURL: env(`${prefix}_BASE_URL`), fetch: quotaFetch(slot) },
    };
    // OpenAI-compatible providers (Groq, Cloudflare) use a static import: initChatModel loads provider
    // packages with a dynamic import() that Next's standalone build cannot trace, so they would be missing
    // from the Docker image. A new provider via initChatModel needs its package imported statically too.
    models.set(slot, !name ? null
      : provider === "openai" ? Promise.resolve(new ChatOpenAI({ model: name, ...fields }))
      : initChatModel(name, { modelProvider: provider, ...fields }));
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

export { parseJson } from "./json.ts";

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

