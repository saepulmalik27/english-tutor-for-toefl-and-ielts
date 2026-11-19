"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { chat } from "@/lib/ai";
import { overallBand } from "@/lib/scoring";
import { recordPatterns } from "@/lib/patterns/record";
import type { PatternTag } from "@/lib/patterns/cards";
import { countWords, lengthPatterns, scoreWriting, writingFeedback, type WritingKind } from "@/lib/writing/score";

const MAX_CHARS = 8000; // well above a 250-word essay; stops runaway pastes reaching the LLM

/** Scores a Writing Task, writes Indonesian Feedback, records Error Patterns. Returns the attempt id. */
export async function submitWritingAction(questionId: string, text: string) {
  const answer = text.trim();
  if (!answer) return { error: "Tulisan masih kosong." };
  if (answer.length > MAX_CHARS) return { error: "Tulisan terlalu panjang." };

  const q = await db.question.findFirst({ where: { id: questionId, status: "active", kind: { in: ["writing_t1", "writing_t2"] } } });
  if (!q) return { error: "Soal tidak ditemukan." };
  const kind = q.kind as WritingKind;
  const bullets = (q.options as string[] | null) ?? [];
  const task = bullets.length ? `${q.prompt}\nIn your letter:\n${bullets.map(b => `- ${b}`).join("\n")}` : q.prompt;

  try {
    const serialChat = (s: string, u: string) => chat(s, u, { serial: true });
    const words = countWords(answer);
    const scores = await scoreWriting(serialChat, kind, task, answer);
    const feedback = await writingFeedback(serialChat, kind, task, answer, scores);
    const tags: PatternTag[] = [...feedback.patterns, ...lengthPatterns(kind, words)];

    const attempt = await db.writingAttempt.create({
      data: {
        questionId, text: answer, wordCount: words,
        scores: scores as unknown as Prisma.InputJsonValue,
        feedback: { ...feedback, patterns: tags } as unknown as Prisma.InputJsonValue,
        band: overallBand(Object.values(scores).map(s => s.band)).mid,
      },
    });
    const ids = [...new Set(tags.map(t => t.id))];
    await recordPatterns(ids.map(id => ({ patternId: id, source: "writing", refId: attempt.id, note: tags.find(t => t.id === id)?.note })));
    return { attemptId: attempt.id };
  } catch (err) {
    console.error("Writing scoring failed:", err);
    return { error: "Penilaian gagal. Coba kirim lagi sebentar lagi." };
  }
}
