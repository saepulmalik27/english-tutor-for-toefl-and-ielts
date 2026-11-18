import { cache } from "react";
import { connection } from "next/server";
import { db } from "./db";

// The app has exactly one Learner; Cloudflare Access is the only gate (PRD v2).
const LEARNER_ID = "learner";

export const getLearner = cache(async () => {
  // Learner data is per request: never prerender it at build time (the build has no database).
  await connection();
  return db.user.upsert({ where: { id: LEARNER_ID }, update: {}, create: { id: LEARNER_ID } });
});
