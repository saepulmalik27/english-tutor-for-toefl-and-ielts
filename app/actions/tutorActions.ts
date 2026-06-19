"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

import { evaluateWritingWithLangChain, type feedbackResult } from "@/lib/ai";

/**
 * Heuristics-based local spelling/grammar analyzer fallback
 */
export async function analyzeWritingLocally(text: string): Promise<feedbackResult> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCount = words.length;

  if (wordCount < 10) {
    return {
      score: 30,
      ieltsBand: 3.5,
      toeflScore: 10,
      feedback: `### Umpan Balik Tutor (Mode Offline)
* **Kuantitas Penulisan:** Tulisan Anda sangat pendek (${wordCount} kata). Cobalah untuk menulis minimal 30-50 kata untuk mengekspresikan ide Anda dengan lebih baik.
* **Tata Bahasa & Struktur:** Silakan tulis kalimat lengkap dengan subjek dan kata kerja.
* **Rekomendasi Kosakata:** Cobalah gunakan kata transisi seperti *because*, *but*, atau *and*.`,
    };
  }

  // Heuristic grammar check
  const errors: string[] = [];
  const lowercaseText = text.toLowerCase();

  // Simple checks for common mistakes
  if (/\b(he|she|it) (want|like|go|do|have|write)\b/.test(lowercaseText)) {
    errors.push("Gunakan akhiran '-s/-es' pada kata kerja setelah subjek tunggal orang ketiga (He/She/It), contoh: *wants*, *likes*, *goes*, *does*, *has*, *writes*.");
  }
  if (/\b(i|you|we|they) (wants|likes|goes|does|has|writes)\b/.test(lowercaseText)) {
    errors.push("Jangan gunakan akhiran '-s/-es' pada kata kerja setelah subjek jamak (I/You/We/They), contoh: *want*, *like*, *go*, *do*, *have*, *write*.");
  }
  if (/\b(a) (apple|orange|egg|hour|honest)\b/.test(lowercaseText)) {
    errors.push("Gunakan artikel 'an' sebelum kata-kata yang berawalan bunyi vokal (contoh: *an apple*, *an hour*).");
  }
  if (/\b(an) (car|book|house|university)\b/.test(lowercaseText)) {
    errors.push("Gunakan artikel 'a' sebelum kata-kata yang berawalan bunyi konsonan (contoh: *a car*, *a university* - karena dilafalkan 'yoo-ni-ver-si-ty').");
  }

  // Complexity analysis
  const complexConjunctions = ["although", "furthermore", "however", "therefore", "consequently", "whereas", "nevertheless", "besides", "moreover", "in addition"];
  const usedComplex = complexConjunctions.filter(word => lowercaseText.includes(word));

  // Determine scores based on length and grammatical complexity
  let score = 55;
  if (wordCount > 30) score += 10;
  if (wordCount > 80) score += 10;
  if (usedComplex.length > 0) score += 10;
  score -= errors.length * 8;
  score = Math.max(30, Math.min(95, score));

  // Estimate IELTS Writing Band based on score
  let ieltsBand = 4.0;
  if (score >= 90) ieltsBand = 7.5;
  else if (score >= 80) ieltsBand = 6.5;
  else if (score >= 70) ieltsBand = 6.0;
  else if (score >= 60) ieltsBand = 5.5;
  else if (score >= 50) ieltsBand = 5.0;
  else ieltsBand = 4.5;

  // Estimate TOEFL Writing Score based on score
  let toeflScore = 12;
  if (score >= 90) toeflScore = 27;
  else if (score >= 80) toeflScore = 23;
  else if (score >= 70) toeflScore = 20;
  else if (score >= 60) toeflScore = 17;
  else if (score >= 50) toeflScore = 14;
  else toeflScore = 12;

  // Build markdown feedback in Indonesian
  let feedbackMarkdown = `### Umpan Balik Tutor (Mode Offline)
  
**Skor Menulis Anda:** **${score}/100** (Estimasi Band IELTS: **${ieltsBand}** | TOEFL: **${toeflScore}**)

#### Analisis Struktur:
* **Jumlah Kata:** ${wordCount} kata. ${wordCount > 50 ? "Panjang tulisan sudah cukup baik untuk latihan harian." : "Cobalah untuk menulis lebih panjang agar bisa menjelaskan ide Anda secara detail."}
* **Kata Penghubung Kompleks:** ${usedComplex.length > 0 ? `Bagus! Anda menggunakan kata penghubung tingkat lanjut seperti: *${usedComplex.join(", ")}*. Ini meningkatkan kelancaran menulis Anda.` : "Tips: Gunakan kata penghubung formal seperti *however*, *therefore*, atau *although* untuk menggabungkan kalimat."}

#### Evaluasi Tata Bahasa (Grammar):
${errors.length > 0 ? errors.map(err => `* ❌ **Koreksi:** ${err}`).join("\n") : "*  **Luar Biasa!** Tidak terdeteksi kesalahan tata bahasa dasar. Pertahankan!"}

#### Contoh Peningkatan Kalimat:
* *Asli:* "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"
* *Saran Perbaikan:* "${errors.length > 0 ? "Perbaiki kesalahan tata bahasa di atas untuk meningkatkan alur kalimat." : "Tulisan Anda sudah natural, cobalah menambahkan variasi kosakata akademik."}"`;

  return { score, ieltsBand, toeflScore, feedback: feedbackMarkdown };
}

/**
 * Call LangChain API for dynamic English tutor writing feedback.
 * Kept for backward compatibility and onboarding actions refactor.
 */
export async function analyzeWritingWithLangChainWrapper(
  text: string,
  prompt: string,
  config: {
    provider: string;
    modelName: string;
    apiKey: string;
    baseUrl?: string;
  }
): Promise<feedbackResult> {
  try {
    return await evaluateWritingWithLangChain(text, prompt, config);
  } catch (error) {
    console.error("LangChain tutoring analysis failed, falling back to local:", error);
    return await analyzeWritingLocally(text);
  }
}

/**
 * Legacy Gemini wrapper kept temporarily for simple API calls or fallback
 */
export async function analyzeWritingWithGemini(text: string, prompt: string, apiKey: string): Promise<feedbackResult> {
  return analyzeWritingWithLangChainWrapper(text, prompt, {
    provider: "gemini",
    modelName: "gemini-2.5-flash",
    apiKey
  });
}

/**
 * Submit journal entry, perform evaluation, update user stats, and store in database
 */
export async function submitJournalAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const prompt = formData.get("prompt")?.toString() || "Daily English Entry";
  const userText = formData.get("userText")?.toString() || "";
  
  // Extract all AI config options from form data
  const aiProvider = formData.get("aiProvider")?.toString() || "gemini";
  const aiModelName = formData.get("aiModelName")?.toString() || "";
  const aiApiKey = formData.get("aiApiKey")?.toString().trim();
  const aiBaseUrl = formData.get("aiBaseUrl")?.toString().trim();

  if (!userText.trim()) {
    return { success: false, error: "Tulisan tidak boleh kosong." };
  }

  try {
    // 1. Analyze text using LangChain with dynamic settings or local heuristic parser
    let evaluation: feedbackResult;
    if (aiApiKey) {
      evaluation = await analyzeWritingWithLangChainWrapper(userText, prompt, {
        provider: aiProvider,
        modelName: aiModelName,
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl
      });
    } else {
      evaluation = await analyzeWritingLocally(userText);
    }

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

    // 3. Update user current Writing metrics and add XP
    const xpGained = 25; // 25 XP for writing a journal
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: xpGained },
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
          xpGained: { increment: xpGained },
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
          xpGained: xpGained,
        },
      });
    }

    return {
      success: true,
      feedback: evaluation.feedback,
      score: evaluation.score,
      ieltsBand: evaluation.ieltsBand,
      toeflScore: evaluation.toeflScore,
      xpGained,
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
  const user = await getSessionUser();
  if (!user) return [];

  return db.journal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}
