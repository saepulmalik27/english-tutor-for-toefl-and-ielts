// Nightly job, triggered by n8n over the internal Docker network (never through the public domain).
import { timingSafeEqual } from "node:crypto";
import { runNightlyJob } from "@/lib/jobs/nightly";

function authorized(req: Request) {
  const secret = process.env.JOB_SECRET ?? "";
  const given = req.headers.get("x-job-secret") ?? "";
  return secret.length > 0 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await runNightlyJob());
  } catch (err) {
    console.error("Nightly job failed:", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
