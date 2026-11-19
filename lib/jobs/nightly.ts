// Nightly job (PRD v2): top up the question bank. Called by POST /api/jobs/generate.
// Covers Reading Section 3, Speaking, Writing and review drills.
import { db } from "@/lib/db";
import { chat } from "@/lib/ai";
import { crawlGoodArticles } from "@/lib/crawl/wikipedia";
import { examplesFor } from "@/lib/questions/examples";
import { generateQuestionSet } from "@/lib/questions/pipeline";
import { planTopUp } from "./stock.ts";
import { prepareDrills } from "@/lib/review/store";
import { generateSpeakingItems, type PromptKind } from "@/lib/questions/prompts";

const MAX_ATTEMPTS = 3;

/** Section 3 passages that have questions and none answered yet. */
const readyReadingS3 = () =>
  db.passage.count({
    where: {
      kind: "reading_s3", status: "active",
      questions: { some: { status: "active" } },
      NOT: { questions: { some: { answers: { some: {} } } } },
    },
  });

const freshPassages = (take: number) =>
  db.passage.findMany({
    where: { kind: "reading_s3", status: "active", questions: { none: {} } },
    orderBy: { createdAt: "asc" },
    take,
  });

async function topUpReadingS3(need: number) {
  let fresh = await freshPassages(need);
  let crawl = null;
  if (fresh.length < need) {
    crawl = await crawlGoodArticles();
    fresh = await freshPassages(need);
  }

  const results = [];
  for (const p of fresh) {
    try {
      const set = await generateQuestionSet(p, (s, u) => chat(s, u, { serial: true }), examplesFor);
      if (set.ok) {
        await db.question.createMany({
          data: set.questions.map((q, i) => ({
            passageId: p.id, kind: "reading_s3" as const, type: q.type, instructions: q.instructions,
            position: i, prompt: q.prompt, options: q.options ?? undefined, answer: q.answer, explanation: q.explanation,
          })),
        });
        results.push({ passage: p.title, ok: true });
        continue;
      }
      results.push({ passage: p.title, ok: false, reason: set.reason });
    } catch (err) {
      results.push({ passage: p.title, ok: false, reason: (err as Error).message });
    }
    // Failed sets are retried on later runs; a passage that keeps failing is retired.
    const attempts = p.generationAttempts + 1;
    await db.passage.update({
      where: { id: p.id },
      data: { generationAttempts: attempts, status: attempts >= MAX_ATTEMPTS ? "retired" : "active" },
    });
  }
  return { crawl, generated: results };
}

// Kinds that are a single prompt (no passage): stocked by generating new prompts.
const PROMPT_KINDS: PromptKind[] = ["speaking_p1", "speaking_p2", "speaking_p3", "writing_t1", "writing_t2"];

/** Prompts of one kind that are active and not answered yet. */
const readyPrompts = (kind: PromptKind) =>
  db.question.count({ where: { kind, status: "active", speakingAttempts: { none: {} }, writingAttempts: { none: {} } } });

async function topUpPrompts(kind: PromptKind, need: number) {
  try {
    const items = await generateSpeakingItems((s, u) => chat(s, u, { serial: true }), kind, need);
    await db.question.createMany({
      data: items.map(i => ({ kind, type: kind, prompt: i.prompt, options: i.bullets ?? undefined })),
    });
    return { saved: items.length };
  } catch (err) {
    return { saved: 0, error: (err as Error).message };
  }
}

export async function runNightlyJob() {
  const ready: Record<string, number> = { reading_s3: await readyReadingS3() };
  for (const kind of PROMPT_KINDS) ready[kind] = await readyPrompts(kind);
  const plan = planTopUp(ready);

  const result: Record<string, unknown> = { plan };
  result.reading_s3 = plan.reading_s3 > 0 ? await topUpReadingS3(plan.reading_s3) : "stock full";
  for (const kind of PROMPT_KINDS) result[kind] = plan[kind] > 0 ? await topUpPrompts(kind, plan[kind]) : "stock full";
  result.drills = await prepareDrills();
  return result;
}
