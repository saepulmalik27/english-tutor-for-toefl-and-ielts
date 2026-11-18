"use client";
// PROTOTYPE variant C — "Hub harian": a home checklist of 3 blocks with the reason each was picked;
// do them in any order (or at different times of day). Feedback shows only the top 2 Error Patterns
// with a "say it again" retry; everything else is collapsed.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mmss, norm, patterns, reading, review, speaking, speakingFeedback as fb, TFNG, useRecorder } from "./mock";

type Block = "speaking" | "reading" | "review";
const CARDS: { k: Block; title: string; mins: number; why: string; color: string }[] = [
  { k: "speaking", title: "Speaking · Part 2", mins: 15, why: "Section terendahmu (5.0–7.0). Part 2 = cue card, bicara 2 menit.", color: "border-violet-500" },
  { k: "reading", title: "Reading · Section 1", mins: 9, why: "Jaga Reading tetap di atas 6; 5 soal TFNG + completion.", color: "border-sky-500" },
  { k: "review", title: "Review · 2 kelemahan", mins: 6, why: "Jatuh tempo hari ini: Bentuk past tense, False vs Not Given.", color: "border-amber-500" },
];

export function VariantC() {
  const [open, setOpen] = useState<Block | null>(null);
  const [done, setDone] = useState<Record<Block, string | null>>({ speaking: null, reading: null, review: null });
  const finish = (k: Block, summary: string) => { setDone(d => ({ ...d, [k]: summary })); setOpen(null); };
  const count = Object.values(done).filter(Boolean).length;

  if (open === "speaking") return <SpeakingBlock onBack={() => setOpen(null)} onDone={s => finish("speaking", s)} />;
  if (open === "reading") return <ReadingBlock onBack={() => setOpen(null)} onDone={s => finish("reading", s)} />;
  if (open === "review") return <ReviewBlock onBack={() => setOpen(null)} onDone={s => finish("review", s)} />;

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pt-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-slate-400">Rabu, 18 Nov</p><h1 className="text-2xl font-bold">Latihan hari ini</h1></div>
        <p className="text-right text-sm"><span className="text-2xl font-bold">{count}/3</span><br /><span className="text-slate-400">🔥 12 hari</span></p>
      </div>
      {CARDS.map(c => (
        <button key={c.k} onClick={() => setOpen(c.k)} className={`block w-full rounded-2xl border-l-4 ${c.color} bg-slate-900 p-4 text-left`}>
          <div className="flex justify-between"><span className="font-semibold">{done[c.k] ? "✅ " : ""}{c.title}</span><span className="text-sm text-slate-400">{c.mins} mnt</span></div>
          <p className="mt-1 text-sm text-slate-400">{done[c.k] ?? c.why}</p>
        </button>
      ))}
      {count === 3 && <p className="rounded-xl bg-emerald-950 p-3 text-center">Semua selesai. Streak +1 🎉</p>}
      <p className="text-xs text-slate-500">Urutan bebas. Bisa Speaking pagi, Reading di jalan, Review malam.</p>
    </div>
  );
}

function Shell({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <button onClick={onBack} className="mb-3 text-sm text-slate-400">← Hari ini</button>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function SpeakingBlock({ onBack, onDone }: { onBack: () => void; onDone: (s: string) => void }) {
  const r = useRecorder();
  const retry = useRecorder();
  const [showAll, setShowAll] = useState(false);
  const top = fb.transcript.filter(s => typeof s !== "string").slice(0, 2) as { wrong: string; fix: string; pattern: string }[];
  return (
    <Shell title="Speaking · Part 2" onBack={onBack}>
      {r.state !== "done" ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900 p-4"><p className="font-semibold">{speaking.cue}</p><ul className="ml-5 mt-2 list-disc text-sm text-slate-300">{speaking.bullets.map(b => <li key={b}>{b}</li>)}</ul></div>
          <p className="text-sm text-slate-400">Siapkan 1 menit, lalu bicara sampai 2 menit.</p>
          {r.state === "idle" ? <Button className="w-full" size="lg" onClick={r.start}>🎙 Rekam</Button> : <Button className="w-full bg-rose-600" size="lg" onClick={r.stop}>■ Stop {mmss(r.seconds)}</Button>}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-300">Band perkiraan <b>{fb.band.low}–{fb.band.high}</b>. Dua hal paling berpengaruh hari ini:</p>
          {top.map((s, i) => (
            <div key={s.pattern} className="rounded-xl border border-rose-800 bg-rose-950/40 p-4">
              <p className="text-xs uppercase text-rose-300">Fokus {i + 1} · {patterns[s.pattern].name}</p>
              <p className="mt-1"><s className="text-slate-400">{s.wrong}</s> → <b className="text-emerald-400">{s.fix}</b></p>
              <p className="mt-1 text-sm text-slate-300">{patterns[s.pattern].why}</p>
            </div>
          ))}
          <div className="rounded-xl bg-slate-900 p-4">
            <p className="text-sm">Coba ucapkan lagi kalimat yang benar: <i>&quot;{top[0].fix} to {top[1].fix}.&quot;</i></p>
            {retry.state === "idle" && <Button className="mt-2" variant="outline" onClick={retry.start}>🎙 Ucapkan lagi</Button>}
            {retry.state === "recording" && <Button className="mt-2" onClick={retry.stop}>■ Stop</Button>}
            {retry.state === "done" && <p className="mt-2 text-sm text-emerald-400">✓ Cocok dengan kalimat target (pura-pura).</p>}
          </div>
          <button className="text-sm text-slate-400 underline" onClick={() => setShowAll(v => !v)}>{showAll ? "Sembunyikan" : "Lihat semua skor & transkrip"}</button>
          {showAll && (
            <div className="space-y-1 text-sm text-slate-400">
              {fb.criteria.map(c => <p key={c.id}>{c.id} {c.band ?? "—"}: {c.note}</p>)}
              <p>WPM {fb.metrics.wpm} · jeda panjang {fb.metrics.longPauses} · filler {fb.metrics.fillers}</p>
              <p className="rounded bg-slate-900 p-2 text-slate-300">{fb.transcript.map(s => typeof s === "string" ? s : s.wrong).join("")}</p>
            </div>
          )}
          <Button className="w-full" size="lg" onClick={() => onDone(`Band ${fb.band.low}–${fb.band.high} · fokus: ${top.map(s => patterns[s.pattern].name).join(", ")}`)}>Selesai</Button>
        </div>
      )}
    </Shell>
  );
}

function ReadingBlock({ onBack, onDone }: { onBack: () => void; onDone: (s: string) => void }) {
  const [a, setA] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const right = reading.questions.filter(q => norm(a[q.n] ?? "") === q.answer).length;
  return (
    <Shell title="Reading · Section 1" onBack={onBack}>
      <article className="rounded-xl bg-slate-900 p-4"><h3 className="font-semibold">{reading.title}</h3><p className="mt-2 whitespace-pre-line text-sm text-slate-300">{reading.text}</p></article>
      <div className="mt-4 space-y-4">
        {reading.questions.map(q => {
          const ok = norm(a[q.n] ?? "") === q.answer;
          return (
            <div key={q.n} className={checked ? (ok ? "border-l-4 border-emerald-500 pl-3" : "border-l-4 border-rose-500 pl-3") : ""}>
              <p className="text-sm font-semibold">{q.n}. {q.q}</p>
              {q.kind === "TFNG"
                ? <div className="mt-1 flex gap-1">{TFNG.map(o => <button key={o} disabled={checked} onClick={() => setA(x => ({ ...x, [q.n]: o }))} className={`rounded-full px-3 py-1 text-xs ${a[q.n] === o ? "bg-sky-600" : "bg-slate-800"}`}>{o}</button>)}</div>
                : <input disabled={checked} className="mt-1 w-full rounded bg-slate-800 p-2 text-sm" value={a[q.n] ?? ""} onChange={e => setA(x => ({ ...x, [q.n]: e.target.value }))} />}
              {checked && !ok && <p className="mt-1 text-xs text-rose-300">Kunci: {q.answer}. {patterns[q.pattern]?.why ?? "Maksimal dua kata."}</p>}
            </div>
          );
        })}
      </div>
      {!checked ? <Button className="mt-4 w-full" size="lg" onClick={() => setChecked(true)}>Cek semua</Button>
        : <Button className="mt-4 w-full" size="lg" onClick={() => onDone(`${right}/${reading.questions.length} benar`)}>Selesai</Button>}
    </Shell>
  );
}

function ReviewBlock({ onBack, onDone }: { onBack: () => void; onDone: (s: string) => void }) {
  const all = review.flatMap(r => r.drills.map(d => ({ ...d, pattern: r.pattern })));
  const [i, setI] = useState(0);
  const [ans, setAns] = useState("");
  const [shown, setShown] = useState(false);
  const [right, setRight] = useState(0);
  const d = all[i];
  return (
    <Shell title="Review" onBack={onBack}>
      <p className="mb-2 text-xs text-amber-400">{patterns[d.pattern].name} · kartu {i + 1}/{all.length}</p>
      <div className="flex min-h-48 flex-col justify-between rounded-2xl bg-slate-900 p-5">
        <p className="text-lg">{d.q}</p>
        {!shown ? (
          <div className="flex gap-2"><input className="flex-1 rounded bg-slate-800 p-2" value={ans} onChange={e => setAns(e.target.value)} /><Button onClick={() => { setShown(true); if (norm(ans) === norm(d.answer)) setRight(r => r + 1); }}>Balik</Button></div>
        ) : (
          <div><p className={norm(ans) === norm(d.answer) ? "text-emerald-400" : "text-rose-300"}>{norm(ans) === norm(d.answer) ? "Benar" : `Jawaban: ${d.answer}`}</p>
            <Button className="mt-2 w-full" onClick={() => i + 1 < all.length ? (setI(i + 1), setAns(""), setShown(false)) : onDone(`${right}/${all.length} benar · jadwal ulang diperbarui`)}>Berikutnya</Button></div>
        )}
      </div>
    </Shell>
  );
}
