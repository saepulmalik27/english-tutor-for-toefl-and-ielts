// "Half a Section 3 passage" for the Reading block: the next 6 unanswered questions of the oldest
// passage that still has some, so a passage is finished over two sessions.
import { db } from "@/lib/db";

export const READING_BLOCK_QUESTIONS = 6;

export async function nextReadingSet() {
  const passage = await db.passage.findFirst({
    where: { status: "active", questions: { some: { status: "active", answers: { none: {} } } } },
    orderBy: { createdAt: "asc" },
    include: {
      questions: {
        where: { status: "active", answers: { none: {} } },
        orderBy: { position: "asc" },
        take: READING_BLOCK_QUESTIONS,
        select: { id: true, instructions: true, prompt: true, options: true }, // never send answer keys
      },
    },
  });
  if (!passage) return null;
  const { questions, ...rest } = passage;
  return { passage: rest, questions: questions.map(q => ({ ...q, options: q.options as string[] | null })) };
}
