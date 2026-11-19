// Database side of the daily Practice Session.
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { wibDay } from "@/lib/bands";
import { sectionBands } from "@/lib/progress";
import { pickDue } from "@/lib/review/select";
import { freshDrills, loadCards, reviewedToday } from "@/lib/review/store";
import { composeSession, daysBetween, weekStart, type Plan } from "./compose.ts";

/** Today's session; composed once on first visit and then kept, so the plan doesn't shift mid-day. */
export async function todaysSession(now = new Date()) {
  const day = wibDay(now);
  const existing = await db.practiceSession.findUnique({ where: { day } });
  if (existing) return { ...existing, plan: existing.plan as unknown as Plan };

  const first = await db.practiceSession.findFirst({ orderBy: { day: "asc" }, select: { day: true } });
  const thisWeek = await db.practiceSession.findMany({ where: { day: { gte: weekStart(day), lt: day } }, select: { plan: true } });
  const { lowest } = await sectionBands();
  const due = pickDue(await loadCards(now), await reviewedToday(now), now);
  let reviewDue = false;
  for (const c of due) if ((await freshDrills(c.patternId)).length >= 3) { reviewDue = true; break; }

  const plan = composeSession({
    dayIndex: first ? daysBetween(first.day, day) : 0,
    lowest,
    writingSwapsThisWeek: thisWeek.filter(s => (s.plan as unknown as Plan).blocks.some(b => b.type === "writing_t1") && lowest === "writing").length,
    reviewDue,
  });
  const created = await db.practiceSession.create({ data: { day, plan: plan as unknown as Prisma.InputJsonValue } });
  return { ...created, plan };
}

/** Moves today's session past `fromStep` (idempotent), recording a note for the summary. */
export async function advanceSession(fromStep: number, note?: string, now = new Date()) {
  const s = await todaysSession(now);
  if (s.step !== fromStep) return s; // already advanced (double click, second tab)
  const results = { ...(s.results as Record<string, string>), ...(note ? { [fromStep]: note } : {}) };
  const step = s.step + 1;
  return db.practiceSession.update({
    where: { id: s.id },
    data: { step, results, completedAt: step >= s.plan.blocks.length ? now : null },
  });
}
