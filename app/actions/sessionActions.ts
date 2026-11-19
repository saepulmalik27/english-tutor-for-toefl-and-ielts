"use server";

import { db } from "@/lib/db";
import { getLearner } from "@/lib/learner";
import { advanceSession } from "@/lib/session/store";

/** Finishes block `step` of today's Practice Session (idempotent). */
export async function advanceSessionAction(step: number) {
  await advanceSession(step);
}

/** New onboarding: after the welcome and microphone check, the Learner goes straight to practice. */
export async function finishOnboardingAction() {
  const learner = await getLearner();
  await db.user.update({ where: { id: learner.id }, data: { isOnboarded: true } });
}
