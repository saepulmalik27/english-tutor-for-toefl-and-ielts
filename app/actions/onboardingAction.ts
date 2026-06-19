"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { 
  analyzeWritingLocally, 
  analyzeWritingWithLangChainWrapper, 
} from "./tutorActions";
import { type feedbackResult } from "@/lib/ai";
import { redirect } from "next/navigation";

// Define interface for onboarding test submissions
export interface OnboardingAnswers {
  q1: string; // He _____ to school yesterday. -> "went"
  q2: string; // Although she was tired, she _____ working on her assignment. -> "continued"
  q3: string; // By the time the manager arrived, the reports _____ by the team. -> "had been finished"
  essay: string; // Brief self-introduction / goals
  aiProvider?: string;
  aiModelName?: string;
  aiApiKey?: string;
  aiBaseUrl?: string;
}

export interface OnboardingResponse {
  success: boolean;
  error?: string;
  ieltsBand?: number;
  toeflScore?: number;
  level?: string;
  xpGained?: number;
}

const PRETEST_ANSWERS = {
  q1: "went",
  q2: "continued",
  q3: "had been finished"
};

/**
 * Handle onboarding pre-test grading and metrics calculation
 */
export async function submitOnboardingAction(answers: OnboardingAnswers): Promise<OnboardingResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Harap login terlebih dahulu." };
  }

  const { q1, q2, q3, essay, aiApiKey } = answers;

  if (!q1 || !q2 || !q3 || !essay.trim()) {
    return { success: false, error: "Semua kolom tes wajib diisi." };
  }

  try {
    // 1. Grade the Reading section (multiple-choice)
    let readingCorrect = 0;
    if (q1.trim().toLowerCase() === PRETEST_ANSWERS.q1) readingCorrect++;
    if (q2.trim().toLowerCase() === PRETEST_ANSWERS.q2) readingCorrect++;
    if (q3.trim().toLowerCase() === PRETEST_ANSWERS.q3) readingCorrect++;

    // Map reading correct count to estimated IELTS/TOEFL bands
    let readingIelts = 4.0;
    let readingToefl = 30;

    if (readingCorrect === 3) {
      readingIelts = 6.5;
      readingToefl = 85;
    } else if (readingCorrect === 2) {
      readingIelts = 5.5;
      readingToefl = 65;
    } else if (readingCorrect === 1) {
      readingIelts = 4.5;
      readingToefl = 45;
    }

    // 2. Grade the Writing section (essay) using LangChain or offline fallback
    let writingEvaluation: feedbackResult;
    const writingPrompt = "Introduce yourself in English and tell us your learning goals.";
    
    const { aiProvider, aiModelName, aiBaseUrl } = answers;
    if (aiApiKey && aiApiKey.trim()) {
      writingEvaluation = await analyzeWritingWithLangChainWrapper(essay, writingPrompt, {
        provider: aiProvider || "gemini",
        modelName: aiModelName || "",
        apiKey: aiApiKey.trim(),
        baseUrl: aiBaseUrl
      });
    } else {
      writingEvaluation = await analyzeWritingLocally(essay);
    }

    // 3. Compute overall initial metrics (averages)
    const initialIeltsBand = Math.round(((readingIelts + writingEvaluation.ieltsBand) / 2) * 10) / 10;
    const initialToeflScore = Math.round((readingToefl + writingEvaluation.toeflScore) / 2);

    // Determine initial recommendation level category
    let userLevel = "Basic";
    if (initialIeltsBand >= 6.5) {
      userLevel = "Advanced";
    } else if (initialIeltsBand >= 5.0) {
      userLevel = "Intermediate";
    }

    // 4. Save results to User and mark as onboarded
    const onboardXpBonus = 50; // starting bonus XP
    await db.user.update({
      where: { id: user.id },
      data: {
        isOnboarded: true,
        xp: onboardXpBonus,
        currentIeltsBand: initialIeltsBand,
        currentToeflScore: initialToeflScore,
        lastActive: new Date(),
      },
    });

    // 5. Store in DailyMetric history snapshot
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    await db.dailyMetric.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: todayStr,
        },
      },
      update: {
        ieltsBand: initialIeltsBand,
        toeflScore: initialToeflScore,
        readingScore: readingCorrect * 33.3,
        writingScore: writingEvaluation.score,
        xpGained: onboardXpBonus,
      },
      create: {
        userId: user.id,
        date: todayStr,
        ieltsBand: initialIeltsBand,
        toeflScore: initialToeflScore,
        readingScore: readingCorrect * 33.3,
        writingScore: writingEvaluation.score,
        xpGained: onboardXpBonus,
      },
    });

    // 6. Save first journal entry as onboarding record
    await db.journal.create({
      data: {
        userId: user.id,
        prompt: "Onboarding Pre-Test diagnostic",
        userText: essay,
        feedback: writingEvaluation.feedback,
        score: writingEvaluation.score,
        ieltsBand: writingEvaluation.ieltsBand,
        toeflScore: writingEvaluation.toeflScore,
      },
    });

    return {
      success: true,
      ieltsBand: initialIeltsBand,
      toeflScore: initialToeflScore,
      level: userLevel,
      xpGained: onboardXpBonus
    };

  } catch (error) {
    console.error("Submit onboarding error:", error);
    return { success: false, error: "Terjadi kesalahan saat menyimpan hasil tes." };
  }
}
