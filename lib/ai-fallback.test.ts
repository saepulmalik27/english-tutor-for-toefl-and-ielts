import { test } from "node:test";
import assert from "node:assert/strict";
import { createSerialQueue, isFallbackError, rateLimitHeaders, withFallback } from "./ai-fallback.ts";

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });
const ok = (v: string) => () => Promise.resolve(v);
const fail = (status: number) => () => Promise.reject(httpError(status));

test("429 and 5xx switch to the fallback provider", async () => {
  assert.equal(await withFallback(fail(429), ok("cloudflare")), "cloudflare");
  assert.equal(await withFallback(fail(503), ok("cloudflare")), "cloudflare");
});

test("primary success never touches the fallback", async () => {
  let called = false;
  const fallback = () => { called = true; return Promise.resolve("cloudflare"); };
  assert.equal(await withFallback(ok("groq"), fallback), "groq");
  assert.equal(called, false);
});

test("client errors and errors without a status are not retried elsewhere", async () => {
  await assert.rejects(withFallback(fail(401), ok("cloudflare")), /HTTP 401/);
  await assert.rejects(withFallback(() => Promise.reject(new Error("boom")), ok("cloudflare")), /boom/);
  assert.equal(isFallbackError(null), false);
});

test("no fallback configured rethrows the primary error", async () => {
  await assert.rejects(withFallback(fail(429), null), /HTTP 429/);
});

test("serial queue runs tasks one at a time, even after a failure", async () => {
  const serial = createSerialQueue();
  let running = 0, maxRunning = 0;
  const task = (v: number, shouldFail = false) => serial(async () => {
    running++; maxRunning = Math.max(maxRunning, running);
    await new Promise(r => setTimeout(r, 5));
    running--;
    if (shouldFail) throw new Error("task failed");
    return v;
  });
  const results = await Promise.allSettled([task(1), task(2, true), task(3)]);
  assert.equal(maxRunning, 1);
  assert.deepEqual(results.map(r => r.status), ["fulfilled", "rejected", "fulfilled"]);
});

test("only x-ratelimit-* headers are kept", () => {
  const h = new Headers({ "x-ratelimit-remaining-tokens": "7000", "content-type": "application/json" });
  assert.deepEqual(rateLimitHeaders(h), { "x-ratelimit-remaining-tokens": "7000" });
  assert.equal(rateLimitHeaders(new Headers()), null);
});
