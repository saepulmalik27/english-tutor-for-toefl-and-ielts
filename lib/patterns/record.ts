// Storage side of Error Patterns: record occurrences and compute the Weakness Profile by query
// (PRD v2: nothing is stored or summarised by an LLM).
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { recordOccurrence, retrievability, reviveCard } from "./cards.ts";
import { OTHER, patternById } from "./taxonomy.ts";

export interface Occurrence { patternId: string; source: string; note?: string; refId?: string }

/** Logs each occurrence and moves its pattern's card (created on first sight, Again afterwards). */
export async function recordPatterns(items: Occurrence[], now = new Date()) {
  for (const item of items) {
    await db.patternEvent.create({ data: { ...item, createdAt: now } });
    if (item.patternId === OTHER) continue; // unclassified mistakes get no card until promoted
    const row = await db.patternCard.findUnique({ where: { patternId: item.patternId } });
    const card = await recordOccurrence(row ? reviveCard(row.card) : null, now);
    const data = { card: card as unknown as Prisma.InputJsonValue, dueAt: card.dueAt };
    await db.patternCard.upsert({ where: { patternId: item.patternId }, update: data, create: { patternId: item.patternId, ...data } });
  }
}

/** Patterns seen in the last 30 days: most frequent first, then the ones most likely forgotten. */
export async function weaknessProfile(now = new Date()) {
  const since = new Date(now.getTime() - 30 * 86_400_000);
  const counts = await db.patternEvent.groupBy({
    by: ["patternId"],
    where: { createdAt: { gte: since }, patternId: { not: OTHER } },
    _count: { _all: true },
  });
  const cards = new Map(
    (await db.patternCard.findMany({ where: { patternId: { in: counts.map(c => c.patternId) } } }))
      .map(c => [c.patternId, reviveCard(c.card)])
  );
  const rows = await Promise.all(counts.map(async c => {
    const card = cards.get(c.patternId);
    return {
      id: c.patternId,
      name: patternById(c.patternId)?.name ?? c.patternId,
      hint: patternById(c.patternId)?.hint ?? "",
      count: c._count._all,
      retrievability: card ? await retrievability(card, now) : 0,
    };
  }));
  return rows.sort((a, b) => b.count - a.count || a.retrievability - b.retrievability);
}
