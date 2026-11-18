"use server";

import { db } from "@/lib/db";
import { getLearner } from "@/lib/learner";

import { evaluateWriting } from "@/lib/ai";

/**
 * Submit journal entry, perform evaluation, update user stats, and store in database
 */
export async function submitJournalAction(formData: FormData) {
  const user = await getLearner();

  const prompt = formData.get("prompt")?.toString() || "Daily English Entry";
  const userText = formData.get("userText")?.toString() || "";
  

  if (!userText.trim()) {
    return { success: false, error: "Tulisan tidak boleh kosong." };
  }


  try {
    // 1. Evaluate with the AI module (Groq, Cloudflare on 429/5xx)
    const evaluation = await evaluateWriting(userText, prompt);

    // 2. Save journal entry in database
    await db.journal.create({
      data: {
        userId: user.id,
        prompt,
        userText,
        feedback: evaluation.feedback,
        score: evaluation.score,
        ieltsBand: evaluation.ieltsBand,
        toeflScore: evaluation.toeflScore,
      },
    });

    // 3. Update user current Writing metrics
    await db.user.update({
      where: { id: user.id },
      data: {
        currentIeltsBand: evaluation.ieltsBand, // update user's overall writing band
        currentToeflScore: evaluation.toeflScore,
      },
    });

    // 4. Update daily metric historical snapshot
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Check if daily metric already exists
    const existingMetric = await db.dailyMetric.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: todayStr,
        },
      },
    });

    if (existingMetric) {
      await db.dailyMetric.update({
        where: { id: existingMetric.id },
        data: {
          ieltsBand: (existingMetric.ieltsBand + evaluation.ieltsBand) / 2, // average them
          toeflScore: Math.round((existingMetric.toeflScore + evaluation.toeflScore) / 2),
          writingScore: evaluation.score,
        },
      });
    } else {
      await db.dailyMetric.create({
        data: {
          userId: user.id,
          date: todayStr,
          ieltsBand: evaluation.ieltsBand,
          toeflScore: evaluation.toeflScore,
          readingScore: user.currentIeltsBand * 10, // approximate reading score fallback
          writingScore: evaluation.score,
        },
      });
    }

    return {
      success: true,
      feedback: evaluation.feedback,
      score: evaluation.score,
      ieltsBand: evaluation.ieltsBand,
      toeflScore: evaluation.toeflScore,
    };
  } catch (error) {
    console.error("Submit journal action failed:", error);
    return { success: false, error: "Gagal memproses jurnal menulis Anda." };
  }
}

/**
 * Fetch writing history
 */
export async function getJournalHistoryAction() {
  const user = await getLearner();

  return db.journal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}
