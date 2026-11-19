// The next unanswered Speaking item, rotating P1 → P2 → P3 after the last answered Part (PRD v2).
import { db } from "@/lib/db";

const ORDER = ["speaking_p1", "speaking_p2", "speaking_p3"] as const;

export async function nextSpeakingItem() {
  const last = await db.speakingAttempt.findFirst({ orderBy: { createdAt: "desc" }, select: { question: { select: { kind: true } } } });
  const start = last ? (ORDER.indexOf(last.question.kind as (typeof ORDER)[number]) + 1) % ORDER.length : 0;
  for (let i = 0; i < ORDER.length; i++) {
    const item = await db.question.findFirst({
      where: { kind: ORDER[(start + i) % ORDER.length], status: "active", speakingAttempts: { none: {} } },
      orderBy: { createdAt: "asc" },
      select: { id: true, kind: true, prompt: true, options: true },
    });
    if (item) return { ...item, options: item.options as string[] | null };
  }
  return null;
}
