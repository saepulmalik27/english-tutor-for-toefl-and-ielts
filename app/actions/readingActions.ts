"use server";

import { db } from "@/lib/db";
import { isCorrect } from "@/lib/questions/answers";
import { readingPattern } from "@/lib/patterns/cards";
import { recordPatterns } from "@/lib/patterns/record";

/** Saves one answer and returns the immediate Feedback for it. */
export async function answerQuestionAction(questionId: string, given: string) {
  const q = await db.question.findFirst({ where: { id: questionId, status: "active" } });
  if (!q?.answer) return { error: "Soal tidak ditemukan atau sudah ditarik." };
  const correct = isCorrect(given, q.answer);
  const saved = await db.answer.create({ data: { questionId, given: given.trim(), correct } });
  if (!correct && q.kind !== "drill") { // drill results rate the card instead (reviewActions)
    await recordPatterns([{ patternId: readingPattern({ ...q, answer: q.answer }, given), source: "reading", refId: saved.id }]);
  }
  // Show the first alternative without optional-word brackets as "the" answer.
  return { correct, answer: q.answer.split("|")[0], explanation: q.explanation ?? "" };
}

/** "Laporkan soal jelek": retires the question so it is never shown again. */
export async function reportQuestionAction(questionId: string) {
  await db.question.update({ where: { id: questionId }, data: { status: "retired" } });
  return { ok: true };
}
