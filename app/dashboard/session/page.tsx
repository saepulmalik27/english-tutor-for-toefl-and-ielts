// Daily Practice Session, prototype variant A (ticket 10): fixed order, one block at a time, a 3-part
// progress bar, immediate Feedback inside each block, and a summary at the end.
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { patternById } from "@/lib/patterns/taxonomy";
import { weaknessProfile } from "@/lib/patterns/record";
import { practiceStreak, sectionBands } from "@/lib/progress";
import { startOfDayWIB } from "@/lib/review/select";
import { currentReview } from "@/lib/review/store";
import { nextSpeakingItem } from "@/lib/speaking/next";
import { nextReadingSet } from "@/lib/session/reading";
import { todaysSession } from "@/lib/session/store";
import type { Block, BlockType } from "@/lib/session/compose";
import { WRITING } from "@/lib/writing/score";
import AdvanceButton from "@/components/AdvanceButton";
import ReviewBlock from "@/components/ReviewBlock";
import SessionReading from "@/components/SessionReading";
import SpeakingTask from "@/components/SpeakingTask";
import WritingTask from "@/components/WritingTask";

const LABEL: Record<BlockType, string> = {
  speaking: "Speaking", reading: "Reading", writing_t1: "Writing Task 1", writing_t2: "Writing Task 2",
  review: "Review", extra_reading: "Reading tambahan", extra_speaking: "Speaking tambahan",
};

export default async function SessionPage({ searchParams }: { searchParams: Promise<{ go?: string }> }) {
  await connection();
  const s = await todaysSession();
  const blocks = s.plan.blocks;
  const started = s.step > 0 || (await searchParams).go === "1";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <ProgressBar blocks={blocks} step={s.completedAt ? blocks.length : started ? s.step : -1} />
      {s.completedAt ? <Summary /> : !started ? (
        <section className="space-y-4 pt-4">
          <h1 className="text-2xl font-bold text-white">Sesi hari ini · {blocks.reduce((n, b) => n + b.minutes, 0)} menit</h1>
          <p className="text-slate-300">{s.plan.reason}</p>
          <ol className="space-y-1 text-sm text-slate-400">
            {blocks.map((b, i) => <li key={i}>{i + 1}. {LABEL[b.type]} · {b.minutes} menit</li>)}
          </ol>
          <Link href="/dashboard/session?go=1" className="block rounded-lg bg-violet-600 py-3 text-center font-semibold text-white">Mulai</Link>
        </section>
      ) : (
        <CurrentBlock block={blocks[s.step]} step={s.step} />
      )}
    </div>
  );
}

function ProgressBar({ blocks, step }: { blocks: Block[]; step: number }) {
  return (
    <div className="flex gap-1" aria-label="Kemajuan sesi">
      {blocks.map((b, i) => (
        <div key={i} className="flex-1">
          <div className={`h-1.5 rounded ${i < step ? "bg-emerald-500" : i === step ? "bg-violet-500" : "bg-slate-800"}`} />
          <p className="mt-1 text-[11px] text-slate-400">{LABEL[b.type]} {b.minutes}&apos;</p>
        </div>
      ))}
    </div>
  );
}

async function CurrentBlock({ block, step }: { block: Block; step: number }) {
  const skip = (msg: string) => (
    <div className="space-y-2 pt-4 text-center text-slate-400"><p>{msg}</p><AdvanceButton step={step} label="Lewati blok ini" /></div>
  );

  if (block.type === "speaking" || block.type === "extra_speaking") {
    const item = await nextSpeakingItem();
    return item ? <SpeakingTask key={item.id} item={item} sessionStep={step} /> : skip("Belum ada soal Speaking. Job malam akan menyiapkannya.");
  }
  if (block.type === "reading" || block.type === "extra_reading") {
    const set = await nextReadingSet();
    return set ? <SessionReading key={set.questions[0].id} passage={set.passage} questions={set.questions} step={step} /> : skip("Belum ada passage dengan soal.");
  }
  if (block.type === "writing_t1" || block.type === "writing_t2") {
    const q = await db.question.findFirst({
      where: { kind: block.type, status: "active", writingAttempts: { none: {} } },
      orderBy: { createdAt: "asc" }, select: { id: true, prompt: true, options: true },
    });
    const w = WRITING[block.type];
    return q
      ? <WritingTask key={q.id} sessionStep={step} item={{ id: q.id, prompt: q.prompt, bullets: q.options as string[] | null, label: w.label, minWords: w.minWords }} />
      : skip(`Belum ada soal ${w.label}.`);
  }
  // review
  const { current } = await currentReview();
  const pattern = current && patternById(current.patternId);
  if (!current || !pattern) {
    return <div className="space-y-2 pt-4 text-center text-slate-300"><p>Review hari ini selesai.</p><AdvanceButton step={step} /></div>;
  }
  return (
    <ReviewBlock key={pattern.id} patternId={pattern.id} name={pattern.name} hint={pattern.hint} format={current.drills[0].type}
      drills={current.drills.map(d => ({ id: d.id, instructions: d.instructions, prompt: d.prompt, options: d.options as string[] | null }))} />
  );
}

async function Summary() {
  const since = startOfDayWIB(new Date());
  const [speaking, writing, answers, streak, { lowest }, top] = await Promise.all([
    db.speakingAttempt.findMany({ where: { createdAt: { gte: since } }, select: { band: true } }),
    db.writingAttempt.findMany({ where: { createdAt: { gte: since } }, select: { band: true } }),
    db.answer.findMany({ where: { createdAt: { gte: since } }, select: { correct: true, question: { select: { kind: true } } } }),
    practiceStreak(), sectionBands(), weaknessProfile().then(w => w[0]),
  ]);
  const reading = answers.filter(a => a.question.kind !== "drill");
  const drills = answers.filter(a => a.question.kind === "drill");
  const right = (xs: { correct: boolean }[]) => `${xs.filter(x => x.correct).length}/${xs.length}`;
  return (
    <section className="space-y-3 pt-4">
      <h2 className="text-2xl font-bold text-white">Selesai 🎉</h2>
      <ul className="space-y-1 text-slate-300">
        {speaking.length > 0 && <li>Speaking: band {Math.max(0, speaking.at(-1)!.band - 1)}–{Math.min(9, speaking.at(-1)!.band + 1)}</li>}
        {writing.length > 0 && <li>Writing: band {Math.max(0, writing.at(-1)!.band - 1)}–{Math.min(9, writing.at(-1)!.band + 1)}</li>}
        {reading.length > 0 && <li>Reading: {right(reading)} benar</li>}
        {drills.length > 0 && <li>Review: {right(drills)} benar</li>}
      </ul>
      <p className="font-semibold text-amber-400">🔥 {streak} hari berturut-turut</p>
      <p className="text-slate-400">
        Besok: {top ? `fokus pada "${top.name}"` : lowest ? `fokus pada ${lowest}` : "lanjutkan rotasi semua Skill"}.
      </p>
      <Link href="/dashboard" className="block rounded-lg border border-slate-700 py-3 text-center text-slate-200">Ke dashboard</Link>
    </section>
  );
}
