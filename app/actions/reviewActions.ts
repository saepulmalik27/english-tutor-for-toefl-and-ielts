"use server";

import { db } from "@/lib/db";
import { transcribe } from "@/lib/ai";
import { fluencyMetrics } from "@/lib/speaking/metrics";
import { speakingDrillPassed } from "@/lib/review/select";
import { rateReviewedPattern } from "@/lib/review/store";

const MAX_BYTES = 3 * 1024 * 1024; // matches serverActions.bodySizeLimit

/** Speaking drill: Whisper only (no LLM scoring); passes when the timing no longer shows the pattern. */
export async function speakingDrillAction(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return { error: "Rekaman kosong. Coba rekam lagi." };
  if (audio.size > MAX_BYTES || !audio.type.startsWith("audio/")) return { error: "Rekaman tidak bisa diproses." };
  const q = await db.question.findFirst({ where: { id: questionId, kind: "drill", status: "active" } });
  if (!q?.patternId) return { error: "Drill tidak ditemukan." };
  try {
    const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
    const { text, words } = await transcribe(audio, `drill.${ext}`);
    if (words.length === 0) return { error: "Tidak ada suara yang terdeteksi. Coba rekam lagi." };
    const metrics = fluencyMetrics(words);
    const passed = speakingDrillPassed(q.patternId, metrics);
    await db.answer.create({ data: { questionId, given: text, correct: passed } });
    return { passed, metrics, transcript: text };
  } catch (err) {
    console.error("Speaking drill failed:", err);
    return { error: "Gagal memproses rekaman. Coba lagi." };
  }
}

/** Called after the last drill of a pattern: rates its FSRS card from today's results. */
export async function finishPatternReviewAction(patternId: string) {
  return rateReviewedPattern(patternId);
}
