"use client";
// PROTOTYPE variant A — "Langkah demi langkah": fixed order Speaking → Reading → Review,
// one item per screen, Feedback right after every answer. Phone-first single column.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mmss, norm, patterns, reading, review, speaking, speakingFeedback as fb, TFNG, useRecorder } from "./mock";

type Step =
  | { k: "intro" } | { k: "prep" } | { k: "speak" } | { k: "speakFb" }
  | { k: "read"; i: number } | { k: "drill"; p: number; i: number } | { k: "done" };

export function VariantA() {
  const [step, setStep] = useState<Step>({ k: "intro" });
  const [score, setScore] = useState({ read: 0, drill: 0 });
  const block = step.k === "intro" ? 0 : ["prep", "speak", "speakFb"].includes(step.k) ? 1 : step.k === "read" ? 2 : step.k === "drill" ? 3 : 4;

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <div className="mb-1 flex gap-1">
        {["Speaking 15'", "Reading 9'", "Review 6'"].map((l, i) => (
          <div key={l} className="flex-1">
            <div className={`h-1.5 rounded ${block > i + 1 ? "bg-emerald-500" : block === i + 1 ? "bg-violet-500" : "bg-slate-800"}`} />
            <p className="mt-1 text-[11px] text-slate-400">{l}</p>
          </div>
        ))}
      </div>

      {step.k === "intro" && (
        <section className="mt-8 space-y-4">
          <h1 className="text-2xl font-bold">Sesi hari ini · 30 menit</h1>
          <p className="text-slate-300">Section terendahmu: <b>Speaking (5.0–7.0)</b>. Kita mulai dari situ, lalu Reading, lalu ulang 2 kelemahan yang jatuh tempo.</p>
          <Button className="w-full" size="lg" onClick={() => setStep({ k: "prep" })}>Mulai</Button>
        </section>
      )}

      {step.k === "prep" && <Prep onDone={() => setStep({ k: "speak" })} />}
      {step.k === "speak" && <Speak onDone={() => setStep({ k: "speakFb" })} />}
      {step.k === "speakFb" && <SpeakFeedback onNext={() => setStep({ k: "read", i: 0 })} />}

      {step.k === "read" && (
        <ReadItem key={step.i} i={step.i} onAnswer={ok => setScore(s => ({ ...s, read: s.read + (ok ? 1 : 0) }))}
          onNext={() => setStep(step.i + 1 < reading.questions.length ? { k: "read", i: step.i + 1 } : { k: "drill", p: 0, i: 0 })} />
      )}

      {step.k === "drill" && (
        <Drill key={`${step.p}-${step.i}`} p={step.p} i={step.i} onAnswer={ok => setScore(s => ({ ...s, drill: s.drill + (ok ? 1 : 0) }))}
          onNext={() => {
            const last = step.i + 1 >= review[step.p].drills.length;
            setStep(!last ? { k: "drill", p: step.p, i: step.i + 1 } : step.p + 1 < review.length ? { k: "drill", p: step.p + 1, i: 0 } : { k: "done" });
          }} />
      )}

      {step.k === "done" && (
        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-bold">Selesai 🎉</h2>
          <p>Speaking: band {fb.band.low}–{fb.band.high} · Reading: {score.read}/{reading.questions.length} · Review: {score.drill}/6</p>
          <p className="text-slate-400">Streak +1. Besok: Reading jadi fokus karena False vs Not Given masih sering tertukar.</p>
        </section>
      )}
    </div>
  );
}

function Prep({ onDone }: { onDone: () => void }) {
  return (
    <section className="mt-6 space-y-4">
      <p className="text-xs uppercase text-violet-400">{speaking.part} · persiapan {speaking.prepSeconds} detik</p>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="font-semibold">{speaking.cue}</p>
        <p className="mt-2 text-sm text-slate-400">You should say:</p>
        <ul className="ml-5 list-disc text-sm text-slate-300">{speaking.bullets.map(b => <li key={b}>{b}</li>)}</ul>
      </div>
      <textarea className="h-28 w-full rounded-xl bg-slate-900 p-3 text-sm" placeholder="Catatan (boleh kosong)…" />
      <Button className="w-full" size="lg" onClick={onDone}>Saya siap bicara</Button>
    </section>
  );
}

function Speak({ onDone }: { onDone: () => void }) {
  const r = useRecorder();
  return (
    <section className="mt-10 flex flex-col items-center gap-6 text-center">
      <p className="text-slate-300">{speaking.cue}</p>
      <p className="font-mono text-5xl">{mmss(r.seconds)} <span className="text-base text-slate-500">/ {mmss(speaking.speakSeconds)}</span></p>
      {r.state === "idle" && <button onClick={r.start} className="size-28 rounded-full bg-rose-600 text-lg font-bold shadow-lg">Rekam</button>}
      {r.state === "recording" && <button onClick={r.stop} className="size-28 animate-pulse rounded-full bg-rose-500 text-lg font-bold">Stop</button>}
      {r.state === "done" && (
        <>
          {r.url && <audio controls src={r.url} className="w-full" />}
          <p className="text-sm text-slate-400">Menilai… (Groq Whisper + LLM, ±10 detik)</p>
          <Button className="w-full" size="lg" onClick={onDone}>Lihat Feedback</Button>
        </>
      )}
    </section>
  );
}

function SpeakFeedback({ onNext }: { onNext: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-xl bg-violet-950 p-4">
        <p className="text-sm text-violet-300">Perkiraan band Speaking</p>
        <p className="text-3xl font-bold">{fb.band.low} – {fb.band.high}</p>
        <p className="text-xs text-violet-300">Rentang ±1 karena penilaian AI belum seakurat penguji.</p>
      </div>
      <div className="space-y-2">
        {fb.criteria.map(c => (
          <div key={c.id} className="rounded-lg border border-slate-800 p-3">
            <div className="flex justify-between font-semibold"><span>{c.name}</span><span>{c.band ?? "—"}</span></div>
            <p className="text-sm text-slate-400">{c.note}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-1 text-sm text-slate-400">Transkrip · ketuk bagian merah</p>
        <p className="rounded-lg bg-slate-900 p-3 leading-7">
          {fb.transcript.map((s, i) => typeof s === "string" ? <span key={i}>{s}</span> : (
            <button key={i} onClick={() => setOpen(open === s.pattern ? null : s.pattern)} className="rounded bg-rose-900/60 px-1 underline decoration-rose-400">{s.wrong}</button>
          ))}
        </p>
        {open && (() => { const seg = fb.transcript.find(s => typeof s !== "string" && s.pattern === open) as { wrong: string; fix: string };
          return <div className="mt-2 rounded-lg border border-rose-800 p-3 text-sm"><b>{patterns[open].name}</b>: <s>{seg.wrong}</s> → <b className="text-emerald-400">{seg.fix}</b><p className="text-slate-300">{patterns[open].why}</p></div>; })()}
      </div>
      <Button className="w-full" size="lg" onClick={onNext}>Lanjut ke Reading</Button>
    </section>
  );
}

function ReadItem({ i, onAnswer, onNext }: { i: number; onAnswer: (ok: boolean) => void; onNext: () => void }) {
  const q = reading.questions[i];
  const [ans, setAns] = useState("");
  const [checked, setChecked] = useState(false);
  const ok = norm(ans) === q.answer;
  const check = (a: string) => { setAns(a); setChecked(true); onAnswer(norm(a) === q.answer); };
  return (
    <section className="mt-4 space-y-3">
      <details className="rounded-lg bg-slate-900 p-3" open={i === 0}>
        <summary className="cursor-pointer font-semibold">{reading.title}</summary>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{reading.text}</p>
      </details>
      <p className="font-semibold">{q.n}. {q.q}</p>
      {q.kind === "TFNG" ? (
        <div className="grid grid-cols-3 gap-2">{TFNG.map(o => <Button key={o} variant={ans === o ? "default" : "outline"} disabled={checked} onClick={() => check(o)}>{o}</Button>)}</div>
      ) : (
        <div className="flex gap-2"><input className="flex-1 rounded-lg bg-slate-900 p-2" value={ans} disabled={checked} onChange={e => setAns(e.target.value)} /><Button disabled={checked} onClick={() => check(ans)}>Cek</Button></div>
      )}
      {checked && (
        <div className={`rounded-lg p-3 text-sm ${ok ? "bg-emerald-950" : "bg-rose-950"}`}>
          {ok ? "Benar." : <>Jawaban: <b>{q.answer}</b>. {patterns[q.pattern]?.why ?? "Maksimal dua kata, eja persis seperti di teks."}</>}
          <Button className="mt-2 w-full" onClick={onNext}>Lanjut</Button>
        </div>
      )}
    </section>
  );
}

function Drill({ p, i, onAnswer, onNext }: { p: number; i: number; onAnswer: (ok: boolean) => void; onNext: () => void }) {
  const d = review[p].drills[i];
  const [ans, setAns] = useState("");
  const [checked, setChecked] = useState(false);
  const ok = norm(ans) === norm(d.answer);
  return (
    <section className="mt-6 space-y-3">
      <p className="text-xs uppercase text-amber-400">Review · {patterns[review[p].pattern].name} · {i + 1}/3</p>
      <p className="font-semibold">{d.q}</p>
      <div className="flex gap-2"><input className="flex-1 rounded-lg bg-slate-900 p-2" value={ans} disabled={checked} onChange={e => setAns(e.target.value)} /><Button disabled={checked} onClick={() => { setChecked(true); onAnswer(norm(ans) === norm(d.answer)); }}>Cek</Button></div>
      {checked && <div className={`rounded-lg p-3 text-sm ${ok ? "bg-emerald-950" : "bg-rose-950"}`}>{ok ? "Benar." : <>Jawaban: <b>{d.answer}</b>. {patterns[review[p].pattern].why}</>}<Button className="mt-2 w-full" onClick={onNext}>Lanjut</Button></div>}
    </section>
  );
}
