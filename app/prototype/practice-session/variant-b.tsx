"use client";
// PROTOTYPE variant B — "Mode ujian": feels like computer-delivered IELTS. Countdown per block,
// numbered question navigator + flag, no Feedback until the end; one report groups all mistakes
// by Error Pattern. UI reference = general knowledge of the CD-IELTS screen, not verified with REA.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { mmss, norm, patterns, reading, review, speaking, speakingFeedback as fb, TFNG, useRecorder } from "./mock";

const BLOCKS = [
  { k: "speaking", label: "Speaking", secs: 15 * 60 },
  { k: "reading", label: "Reading", secs: 9 * 60 },
  { k: "review", label: "Review", secs: 6 * 60 },
] as const;

export function VariantB() {
  const [b, setB] = useState(0); // 3 = report
  const [left, setLeft] = useState<number>(BLOCKS[0].secs);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => { const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  const set = (id: string, v: string) => setAnswers(a => ({ ...a, [id]: v }));
  const next = (n: number) => { setB(n); if (n < 3) setLeft(BLOCKS[n].secs); };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-100 px-4 py-2 text-slate-900">
        <span className="font-semibold">{b < 3 ? `${BLOCKS[b].label} · bagian ${b + 1}/3` : "Laporan sesi"}</span>
        {b < 3 && <span className={`font-mono text-lg ${left < 60 ? "text-rose-600" : ""}`}>⏱ {mmss(left)}</span>}
      </header>
      <div className="flex-1">
        {b === 0 && <SpeakingExam onSubmit={() => next(1)} />}
        {b === 1 && <ReadingExam answers={answers} set={set} onSubmit={() => next(2)} />}
        {b === 2 && <ReviewExam answers={answers} set={set} onSubmit={() => next(3)} />}
        {b === 3 && <Report answers={answers} />}
      </div>
    </div>
  );
}

function SpeakingExam({ onSubmit }: { onSubmit: () => void }) {
  const r = useRecorder();
  const [prep, setPrep] = useState(speaking.prepSeconds);
  useEffect(() => { if (prep <= 0) return; const t = setTimeout(() => setPrep(p => p - 1), 1000); return () => clearTimeout(t); }, [prep]);
  return (
    <section className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="border border-slate-600 bg-white p-4 text-slate-900">
        <p className="font-semibold">{speaking.cue}</p>
        <p className="mt-2 text-sm">You should say:</p>
        <ul className="ml-5 list-disc text-sm">{speaking.bullets.map(x => <li key={x}>{x}</li>)}</ul>
      </div>
      {r.state === "idle" && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Persiapan: <b className="font-mono">{mmss(prep)}</b>. Rekaman mulai saat kamu tekan tombol (di tes asli otomatis).</p>
          <Button className="w-full" onClick={r.start}>Mulai bicara</Button>
        </div>
      )}
      {r.state === "recording" && <Button className="w-full bg-rose-600" onClick={r.stop}>● Merekam {mmss(r.seconds)} / 2:00 — stop</Button>}
      {r.state === "done" && <><p className="text-sm text-slate-400">Jawaban tersimpan. Feedback ada di laporan akhir.</p><Button className="w-full" onClick={onSubmit}>Lanjut ke Reading →</Button></>}
    </section>
  );
}

function Navigator({ ids, answers, flags, cur, go }: { ids: string[]; answers: Record<string, string>; flags: Set<string>; cur: number; go: (i: number) => void }) {
  return (
    <nav className="fixed bottom-16 left-0 right-0 flex justify-center gap-1 border-t border-slate-700 bg-slate-200 p-2">
      {ids.map((id, i) => (
        <button key={id} onClick={() => go(i)}
          className={`relative size-9 border text-sm font-semibold ${i === cur ? "border-blue-600 bg-blue-600 text-white" : answers[id] ? "border-slate-500 bg-slate-500 text-white" : "border-slate-500 bg-white text-slate-900"}`}>
          {i + 1}{flags.has(id) && <span className="absolute -right-1 -top-1 text-xs">🚩</span>}
        </button>
      ))}
    </nav>
  );
}

function ReadingExam({ answers, set, onSubmit }: { answers: Record<string, string>; set: (id: string, v: string) => void; onSubmit: () => void }) {
  const [cur, setCur] = useState(0);
  const [tab, setTab] = useState<"text" | "q">("text");
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const q = reading.questions[cur];
  const id = `r${q.n}`;
  return (
    <section className="pb-32">
      <div className="flex border-b border-slate-700 md:hidden">
        {(["text", "q"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 p-2 ${tab === t ? "bg-slate-800 font-semibold" : ""}`}>{t === "text" ? "Teks" : "Soal"}</button>)}
      </div>
      <div className="md:grid md:grid-cols-2">
        <article className={`${tab === "text" ? "" : "hidden"} border-slate-700 bg-white p-4 text-slate-900 md:block md:border-r`}>
          <h3 className="font-bold">{reading.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm">{reading.text}</p>
        </article>
        <div className={`${tab === "q" ? "" : "hidden"} space-y-3 p-4 md:block`}>
          <p className="text-xs text-slate-400">Questions 1–5 · {q.kind === "TFNG" ? "TRUE / FALSE / NOT GIVEN" : "NO MORE THAN TWO WORDS"}</p>
          <p className="font-semibold">{q.n}. {q.q}</p>
          {q.kind === "TFNG"
            ? TFNG.map(o => <label key={o} className="flex items-center gap-2"><input type="radio" checked={answers[id] === o} onChange={() => set(id, o)} />{o}</label>)
            : <input className="w-full border border-slate-500 bg-white p-2 text-slate-900" value={answers[id] ?? ""} onChange={e => set(id, e.target.value)} />}
          <button className="text-sm text-amber-400" onClick={() => setFlags(f => { const n = new Set(f); if (n.has(id)) n.delete(id); else n.add(id); return n; })}>🚩 {flags.has(id) ? "Hapus tanda" : "Tandai untuk dicek"}</button>
          <Button className="w-full" onClick={onSubmit}>Kumpulkan Reading →</Button>
        </div>
      </div>
      <Navigator ids={reading.questions.map(x => `r${x.n}`)} answers={answers} flags={flags} cur={cur} go={i => { setCur(i); setTab("q"); }} />
    </section>
  );
}

function ReviewExam({ answers, set, onSubmit }: { answers: Record<string, string>; set: (id: string, v: string) => void; onSubmit: () => void }) {
  return (
    <section className="mx-auto max-w-2xl space-y-5 p-4">
      {review.map((r, p) => (
        <div key={r.pattern} className="space-y-2">
          <p className="text-xs uppercase text-slate-400">Bagian {p + 1}</p>
          {r.drills.map((d, i) => <label key={i} className="block text-sm">{d.q}<input className="mt-1 w-full border border-slate-500 bg-white p-2 text-slate-900" value={answers[`d${p}${i}`] ?? ""} onChange={e => set(`d${p}${i}`, e.target.value)} /></label>)}
        </div>
      ))}
      <Button className="w-full" onClick={onSubmit}>Kumpulkan dan lihat laporan</Button>
    </section>
  );
}

function Report({ answers }: { answers: Record<string, string> }) {
  const wrongR = reading.questions.filter(q => norm(answers[`r${q.n}`] ?? "") !== q.answer);
  const wrongD = review.flatMap((r, p) => r.drills.map((d, i) => ({ ...d, pattern: r.pattern, a: answers[`d${p}${i}`] ?? "" })).filter(d => norm(d.a) !== norm(d.answer)));
  const byPattern: Record<string, string[]> = {};
  fb.transcript.forEach(s => { if (typeof s !== "string") (byPattern[s.pattern] ??= []).push(`Speaking: "${s.wrong}" → "${s.fix}"`); });
  wrongR.forEach(q => (byPattern[q.pattern] ??= []).push(`Reading ${q.n}: jawabanmu "${answers[`r${q.n}`] ?? "-"}", kunci ${q.answer}`));
  wrongD.forEach(d => (byPattern[d.pattern] ??= []).push(`Review: ${d.q} → ${d.answer}`));
  return (
    <section className="mx-auto max-w-2xl space-y-5 p-4">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-700 text-left text-slate-400"><th>Section</th><th>Hasil hari ini</th><th>Perkiraan band</th></tr></thead>
        <tbody>
          <tr className="border-b border-slate-800"><td>Speaking</td><td>{fb.criteria.filter(c => c.band).map(c => `${c.id} ${c.band}`).join(" · ")}</td><td>{fb.band.low}–{fb.band.high}</td></tr>
          <tr className="border-b border-slate-800"><td>Reading</td><td>{reading.questions.length - wrongR.length}/{reading.questions.length}</td><td>6.0–7.0</td></tr>
          <tr><td>Review</td><td>{6 - wrongD.length}/6</td><td>—</td></tr>
        </tbody>
      </table>
      <h3 className="font-bold">Kesalahan per Error Pattern</h3>
      {Object.entries(byPattern).map(([p, items]) => (
        <div key={p} className="border-l-4 border-rose-500 pl-3">
          <p className="font-semibold">{patterns[p]?.name ?? p} · {items.length}×</p>
          <p className="text-sm text-slate-300">{patterns[p]?.why}</p>
          <ul className="ml-4 list-disc text-sm text-slate-400">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      ))}
    </section>
  );
}
