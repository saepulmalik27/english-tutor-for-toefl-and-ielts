"use server";

import { db } from "@/lib/db";
import { getLearner } from "@/lib/learner";

/**
 * Fetch stats for the dashboard graphs
 */
export async function getUserStatsAction() {
  const user = await getLearner();

  // Get daily metric history (limit to last 7 days)
  const history = await db.dailyMetric.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    take: 7,
  });

  // Calculate completed readings & writing counts
  // Reading answers return in ticket 05; until then show how many passages the bank holds.
  const completedReadingsCount = await db.passage.count({ where: { status: "active" } });

  const completedWritingsCount = await db.journal.count({
    where: { userId: user.id },
  });

  return {
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
    })),
  };
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
