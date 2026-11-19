// Database side of the review block: due cards, today's reviews, drill stock and card rating.
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { chat } from "@/lib/ai";
import { retrievability, reviewCard, reviveCard } from "@/lib/patterns/cards";
import { patternById } from "@/lib/patterns/taxonomy";
import { generateDrills } from "./drills.ts";
import { DAILY_PATTERNS, dueSoon, DRILLS_PER_PATTERN, pickDue, startOfDayWIB, type DueCard } from "./select.ts";

export async function loadCards(now: Date): Promise<DueCard[]> {
  const rows = await db.patternCard.findMany();
  return Promise.all(rows.map(async r => {
    const card = reviveCard(r.card);
    return { patternId: r.patternId, dueAt: card.dueAt, retrievability: await retrievability(card, now) };
  }));
}

/** Patterns whose drills were answered since midnight WIB. */
export async function reviewedToday(now: Date): Promise<Set<string>> {
  const rows = await db.answer.findMany({
    where: { createdAt: { gte: startOfDayWIB(now) }, question: { kind: "drill" } },
    select: { question: { select: { patternId: true } } },
  });
  return new Set(rows.map(r => r.question.patternId).filter((id): id is string => !!id));
}

export const freshDrills = (patternId: string) =>
  db.question.findMany({
    where: { kind: "drill", patternId, status: "active", answers: { none: {} } },
    orderBy: { createdAt: "asc" },
    take: DRILLS_PER_PATTERN,
  });

/** Nightly: 3 fresh drills for every card due within 2 days. Failed sets are retried the next night. */
export async function prepareDrills(now = new Date()) {
  const results = [];
  for (const c of dueSoon(await loadCards(now), now)) {
    const pattern = patternById(c.patternId);
    if (!pattern || (await freshDrills(c.patternId)).length >= DRILLS_PER_PATTERN) continue;
    try {
      const set = await generateDrills((s, u) => chat(s, u, { serial: true }), pattern);
      if (set.ok) {
        await db.question.createMany({
          data: set.drills.map((d, i) => ({
            kind: "drill" as const, patternId: c.patternId, type: set.format, position: i, instructions: d.instructions || null,
            prompt: d.prompt, options: d.options ?? undefined, answer: d.answer || null, explanation: d.explanation || null,
          })),
        });
      }
      results.push({ pattern: c.patternId, ...(set.ok ? { ok: true } : set) });
    } catch (err) {
      results.push({ pattern: c.patternId, ok: false, reason: (err as Error).message });
    }
  }
  return results;
}

/** After the drills: today's correct answers for this pattern rate its card (0-1 Again, 2 Hard, 3 Good). */
export async function rateReviewedPattern(patternId: string, now = new Date()) {
  const answers = await db.answer.findMany({
    where: { createdAt: { gte: startOfDayWIB(now) }, question: { kind: "drill", patternId } },
    select: { correct: true },
  });
  const row = await db.patternCard.findUnique({ where: { patternId } });
  if (!row || answers.length === 0) return null;
  const correct = answers.filter(a => a.correct).length;
  const card = await reviewCard(reviveCard(row.card), correct, now);
  await db.patternCard.update({ where: { patternId }, data: { card: card as unknown as Prisma.InputJsonValue, dueAt: card.dueAt } });
  return { correct, dueAt: card.dueAt };
}

/** Today's review state: the first due pattern with drills ready, patterns still waiting for drills, and whether the daily cap is used up. */
export async function currentReview(now = new Date()) {
  const done = await reviewedToday(now);
  const due = pickDue(await loadCards(now), done, now);
  let current = null;
  const waiting: string[] = [];
  for (const c of due) {
    const drills = await freshDrills(c.patternId);
    if (drills.length >= DRILLS_PER_PATTERN && !current) current = { patternId: c.patternId, drills };
    else if (drills.length < DRILLS_PER_PATTERN) waiting.push(patternById(c.patternId)?.name ?? c.patternId);
  }
  return { current, waiting, capReached: done.size >= DAILY_PATTERNS };
}
