// Dashboard data computed from what the Learner actually did (no stored scores or streak counters).
import { db } from "@/lib/db";
import { lowestSection, readingBand, speakingBand, streakDays, writingBand, type BandRange, type Section } from "@/lib/bands";

export async function sectionBands(): Promise<{ bands: Record<Section, BandRange | null>; lowest: Section | null }> {
  const [reading, writing, speaking] = await Promise.all([
    db.answer.findMany({
      where: { question: { kind: { in: ["reading_s1", "reading_s2", "reading_s3"] } } }, // drills excluded
      orderBy: { createdAt: "desc" }, take: 80, select: { correct: true },
    }),
    db.writingAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { band: true, question: { select: { kind: true } } } }),
    db.speakingAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { band: true } }),
  ]);
  const bands: Record<Section, BandRange | null> = {
    reading: readingBand(reading.map(a => a.correct)),
    listening: null, // not in the MVP
    writing: writingBand(writing.map(w => ({ band: w.band, task2: w.question.kind === "writing_t2" }))),
    speaking: speakingBand(speaking.map(s => s.band)),
  };
  return { bands, lowest: lowestSection(bands) };
}

/** Consecutive WIB days with a completed Practice Session (PRD v2: sessions, not logins). */
export async function practiceStreak(now = new Date()) {
  const done = await db.practiceSession.findMany({ where: { completedAt: { not: null } }, select: { day: true } });
  return streakDays(done.map(s => s.day), now);
}

/** Today's remaining Groq requests (chat and speech-to-text), from the last response headers. */
export async function groqQuota() {
  const rows = await db.aiQuota.findMany({ where: { source: { in: ["chat", "stt"] } } });
  return rows.map(r => {
    const h = r.headers as Record<string, string>;
    return {
      source: r.source === "chat" ? "Chat" : "Speech-to-text",
      remaining: Number(h["x-ratelimit-remaining-requests"]),
      limit: Number(h["x-ratelimit-limit-requests"]),
      updatedAt: r.updatedAt,
    };
  });
}
