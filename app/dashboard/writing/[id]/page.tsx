// Feedback for one Writing attempt: shown right after submitting and when reopened from the history.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import FeedbackView from "@/components/FeedbackView";
import { namedSegments, type PatternTag } from "@/lib/patterns/cards";
import { overallBand, type Scores } from "@/lib/scoring";
import { CRITERION_NAMES, WRITING, type WritingKind } from "@/lib/writing/score";

export default async function WritingAttemptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session?: string }> }) {
  const { id } = await params;
  const fromSession = (await searchParams).session === "1";
  const attempt = await db.writingAttempt.findUnique({ where: { id }, include: { question: true } });
  if (!attempt) notFound();

  const kind = attempt.question.kind as WritingKind;
  const scores = attempt.scores as unknown as Scores<string>;
  const feedback = attempt.feedback as unknown as { summary: string; criteria: Record<string, string>; patterns: PatternTag[] };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={`/dashboard/writing?task=${kind === "writing_t1" ? "t1" : "t2"}`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeftIcon className="size-3.5" /> Kembali ke Writing
      </Link>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-wide text-emerald-400">{WRITING[kind].label} · {attempt.wordCount} kata</p>
        <p className="whitespace-pre-wrap">{attempt.question.prompt}</p>
      </div>
      <FeedbackView
        title={`Perkiraan band Writing ${WRITING[kind].label}`}
        band={overallBand(WRITING[kind].criteria.map(c => scores[c].band))}
        summary={feedback.summary}
        criteria={WRITING[kind].criteria.map(c => ({ name: CRITERION_NAMES[c], band: scores[c].band, note: feedback.criteria[c] }))}
        textLabel="Tulisanmu"
        {...namedSegments(attempt.text, feedback.patterns)}
      />
      {fromSession && (
        <Link href="/dashboard/session" className="block rounded-lg bg-violet-600 py-3 text-center font-semibold text-white">Lanjut sesi</Link>
      )}
    </div>
  );
}
