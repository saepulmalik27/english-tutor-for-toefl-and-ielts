// Pure helpers for lib/ai.ts. No LangChain or DB imports, so `node --test` can run them directly.

/** PRD v2: switch to the fallback provider only on rate limits (429) and server errors (5xx). */
export function isFallbackError(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === "number" && (status === 429 || status >= 500);
}

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: (() => Promise<T>) | null
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    if (!fallback || !isFallbackError(err)) throw err;
    console.warn("AI primary provider failed, using fallback:", (err as Error).message);
    return fallback();
  }
}

/** Runs tasks one at a time: Groq's free tier allows 8K tokens/minute, so scoring calls must not overlap. */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task, task);
    tail = run.catch(() => {});
    return run;
  };
}

/** The provider's x-ratelimit-* headers, or null when it sent none. */
export function rateLimitHeaders(headers: Headers): Record<string, string> | null {
  const found = Object.fromEntries([...headers].filter(([k]) => k.startsWith("x-ratelimit-")));
  return Object.keys(found).length ? found : null;
}
