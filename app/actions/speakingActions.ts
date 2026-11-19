"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { chat, transcribe } from "@/lib/ai";
import { fluencyMetrics, fluencyPatterns } from "@/lib/speaking/metrics";
import { overallBand } from "@/lib/scoring";
import { namedSegments, type PatternTag } from "@/lib/patterns/cards";
import { recordPatterns } from "@/lib/patterns/record";
import { CRITERIA, scoreSpeaking, speakingFeedback } from "@/lib/speaking/score";

const MAX_BYTES = 3 * 1024 * 1024; // matches serverActions.bodySizeLimit
const json = (v: unknown) => v as Prisma.InputJsonValue;

/** Record → Whisper → fluency metrics → scores → Indonesian Feedback. The audio is never stored. */
export async function submitSpeakingAction(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return { error: "Rekaman kosong. Coba rekam lagi." };
  if (audio.size > MAX_BYTES) return { error: "Rekaman terlalu besar (maks 3 MB)." };
  if (!audio.type.startsWith("audio/")) return { error: "Format rekaman tidak dikenali." };

  const q = await db.question.findFirst({ where: { id: questionId, status: "active", kind: { in: ["speaking_p1", "speaking_p2", "speaking_p3"] } } });
  if (!q) return { error: "Soal tidak ditemukan." };
  const task = [q.prompt, ...((q.options as string[] | null) ?? [])].join("\n");

  try {
    const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
    const { text, words } = await transcribe(audio, `answer.${ext}`);
    if (words.length === 0) return { error: "Tidak ada suara yang terdeteksi. Coba rekam lagi." };

    const metrics = fluencyMetrics(words);
    const scores = await scoreSpeaking((s, u) => chat(s, u, { serial: true }), task, text, metrics);
    const feedback = await speakingFeedback((s, u) => chat(s, u, { serial: true }), task, text, scores);
    const band = overallBand(CRITERIA.map(c => scores[c].band));
    // Timing-based FC patterns join the LLM's tags (they have no quote, so they are listed, not highlighted).
    const tags: PatternTag[] = [...feedback.patterns, ...fluencyPatterns(metrics, q.kind)];

    const attempt = await db.speakingAttempt.create({
      data: { questionId, transcript: text, words: json(words), metrics: json(metrics), scores: json(scores), feedback: json({ ...feedback, patterns: tags }), band: band.mid },
    });
    // One occurrence per pattern per answer, so repeating a mistake twice in one answer is one Again.
    const ids = [...new Set(tags.map(t => t.id))];
    await recordPatterns(ids.map(id => ({ patternId: id, source: "speaking", refId: attempt.id, note: tags.find(t => t.id === id)?.note })));

    return { transcript: text, metrics, scores, feedback, band, ...namedSegments(text, tags) };
  } catch (err) {
    console.error("Speaking scoring failed:", err);
    return { error: "Penilaian gagal. Coba kirim lagi sebentar lagi." };
  }
}
