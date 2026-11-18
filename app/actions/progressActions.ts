"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { compressUserLearningProgress } from "@/app/actions/generatorActions";

export interface QuizSubmissionResponse {
  success: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  ieltsBand: number;
  toeflScore: number;
  xpGained: number;
  error?: string;
}

/**
 * Map quiz percentage to estimated TOEFL & IELTS Reading Scores
 */
function mapQuizScoreToMetrics(percentage: number): { ieltsBand: number; toeflScore: number } {
  let ieltsBand = 4.0;
  let toeflScore = 12;

  if (percentage >= 95) {
    ieltsBand = 8.5;
    toeflScore = 29;
  } else if (percentage >= 85) {
    ieltsBand = 7.5;
    toeflScore = 26;
  } else if (percentage >= 70) {
    ieltsBand = 6.5;
    toeflScore = 22;
  } else if (percentage >= 50) {
    ieltsBand = 5.5;
    toeflScore = 17;
  } else if (percentage >= 30) {
    ieltsBand = 4.5;
    toeflScore = 13;
  }

  return { ieltsBand, toeflScore };
}

/**
 * Handle reading quiz submissions
 */
export async function submitQuizAction(
  articleId: string,
  userAnswers: Record<string, string>
): Promise<QuizSubmissionResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Harap login terlebih dahulu.", score: 0, correctAnswers: 0, totalQuestions: 0, ieltsBand: 4.0, toeflScore: 30, xpGained: 0 };
  }

  try {
    // A. Check if it is a generated article first
    const generatedArticle = await db.generatedArticle.findUnique({
      where: { id: articleId },
      include: { questions: true }
    });

    if (generatedArticle) {
      // 2. Grade the answers
      let correctCount = 0;
      generatedArticle.questions.forEach((q) => {
        const userAnswer = userAnswers[q.id]?.trim();
        const correctAnswer = q.answer.trim();
        if (userAnswer === correctAnswer) {
          correctCount++;
        }
      });

      const totalQuestions = generatedArticle.questions.length;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
      const { ieltsBand, toeflScore } = mapQuizScoreToMetrics(scorePercentage);

      // 3. Mark progress as completed in GeneratedProgress
      await db.generatedProgress.upsert({
        where: {
          userId_articleId: {
            userId: user.id,
            articleId,
          },
        },
        update: {
          completed: true,
          quizScore: scorePercentage,
        },
        create: {
          userId: user.id,
          articleId,
          completed: true,
          quizScore: scorePercentage,
        },
      });

      // 4. Update user overall metrics and award XP
      const xpGained = 15 + correctCount * 5;
      const newIeltsBand = Math.round(((user.currentIeltsBand + ieltsBand) / 2) * 10) / 10;
      const newToeflScore = Math.round((user.currentToeflScore + toeflScore) / 2);

      await db.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: xpGained },
          currentIeltsBand: newIeltsBand,
          currentToeflScore: newToeflScore,
        },
      });

      // 5. Update daily metric historical snapshot
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
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
            ieltsBand: Math.round(((existingMetric.ieltsBand + ieltsBand) / 2) * 10) / 10,
            toeflScore: Math.round((existingMetric.toeflScore + toeflScore) / 2),
            readingScore: scorePercentage,
            xpGained: { increment: xpGained },
          },
        });
      } else {
        await db.dailyMetric.create({
          data: {
            userId: user.id,
            date: todayStr,
            ieltsBand,
            toeflScore,
            readingScore: scorePercentage,
            writingScore: 0,
            xpGained,
          },
        });
      }

      // Trigger user profile memory compression asynchronously
      await compressUserLearningProgress();

      return {
        success: true,
        score: scorePercentage,
        correctAnswers: correctCount,
        totalQuestions,
        ieltsBand,
        toeflScore,
        xpGained,
      };
    }

    // B. Normal Static Article Flow
    // 1. Fetch questions for the article
    const questions = await db.question.findMany({
      where: { articleId },
    });

    if (questions.length === 0) {
      return { success: false, error: "Tidak ada pertanyaan untuk kuis ini.", score: 0, correctAnswers: 0, totalQuestions: 0, ieltsBand: 4.0, toeflScore: 30, xpGained: 0 };
    }

    // 2. Grade the answers
    let correctCount = 0;
    questions.forEach((q) => {
      const userAnswer = userAnswers[q.id]?.trim();
      const correctAnswer = q.answer.trim();
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const { ieltsBand, toeflScore } = mapQuizScoreToMetrics(scorePercentage);

    // 3. Mark progress as completed
    await db.userProgress.upsert({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId,
        },
      },
      update: {
        completed: true,
        quizScore: scorePercentage,
      },
      create: {
        userId: user.id,
        articleId,
        completed: true,
        quizScore: scorePercentage,
      },
    });

    // 4. Update user overall metrics and award XP
    // 10 XP base for reading + 5 XP per correct answer
    const xpGained = 10 + correctCount * 5;

    // We aggregate the new scores with existing user overall stats (moving average)
    const newIeltsBand = Math.round(((user.currentIeltsBand + ieltsBand) / 2) * 10) / 10;
    const newToeflScore = Math.round((user.currentToeflScore + toeflScore) / 2);

    await db.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: xpGained },
        currentIeltsBand: newIeltsBand,
        currentToeflScore: newToeflScore,
      },
    });

    // 5. Update daily metric historical snapshot
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
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
          ieltsBand: Math.round(((existingMetric.ieltsBand + ieltsBand) / 2) * 10) / 10,
          toeflScore: Math.round((existingMetric.toeflScore + toeflScore) / 2),
          readingScore: scorePercentage,
          xpGained: { increment: xpGained },
        },
      });
    } else {
      await db.dailyMetric.create({
        data: {
          userId: user.id,
          date: todayStr,
          ieltsBand,
          toeflScore,
          readingScore: scorePercentage,
          writingScore: 0, // Not written today yet
          xpGained,
        },
      });
    }

    // Trigger context compression
    await compressUserLearningProgress();

    return {
      success: true,
      score: scorePercentage,
      correctAnswers: correctCount,
      totalQuestions,
      ieltsBand,
      toeflScore,
      xpGained,
    };

  } catch (error) {
    console.error("Submit quiz error:", error);
    return { success: false, error: "Terjadi kesalahan saat memproses kuis.", score: 0, correctAnswers: 0, totalQuestions: 0, ieltsBand: 4.0, toeflScore: 30, xpGained: 0 };
  }
}

/**
 * Fetch stats for the dashboard graphs
 */
export async function getUserStatsAction() {
  const user = await getSessionUser();
  if (!user) return null;

  // Get daily metric history (limit to last 7 days)
  const history = await db.dailyMetric.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    take: 7,
  });

  // Calculate completed readings & writing counts
  const completedReadingsCount = await db.userProgress.count({
    where: { userId: user.id, completed: true },
  });

  const completedWritingsCount = await db.journal.count({
    where: { userId: user.id },
  });

  return {
    xp: user.xp,
    streak: user.streak,
    ieltsBand: user.currentIeltsBand,
    toeflScore: user.currentToeflScore,
    completedReadings: completedReadingsCount,
    completedWritings: completedWritingsCount,
    history: history.map(h => ({
      date: h.date.substring(5), // return MM-DD for cleaner chart labels
      ieltsBand: h.ieltsBand,
      toeflScore: h.toeflScore,
      readingScore: h.readingScore,
      writingScore: h.writingScore,
      xp: h.xpGained,
    })),
  };
}

/**
 * Fetch articles list with user completion status
 */
export async function getArticlesAction() {
  const user = await getSessionUser();
  if (!user) return [];

  const articles = await db.article.findMany({
    include: {
      progress: {
        where: { userId: user.id },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return articles.map(art => {
    const userProg = art.progress[0];
    return {
      id: art.id,
      title: art.title,
      difficulty: art.difficulty,
      description: art.description,
      completed: userProg?.completed || false,
      score: userProg?.quizScore ?? null,
    };
  });
}

/**
 * Fetch a single article details along with its questions
 */
export async function getArticleDetailsAction(articleId: string) {
  return db.article.findUnique({
    where: { id: articleId },
    include: {
      questions: true,
    },
  });
}

/**
 * Fetch the 10% formal learning lessons list
 */
export async function getLessonsAction() {
  return db.lesson.findMany({
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Fetch a single formal lesson by ID
 */
export async function getLessonByIdAction(lessonId: string) {
  return db.lesson.findUnique({
    where: { id: lessonId },
  });
}
