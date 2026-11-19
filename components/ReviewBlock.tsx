"use client";
// One due Error Pattern: 3 drills, then its FSRS card is rated from the result (0-1 Again, 2 Hard, 3 Good).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import QuestionFlow, { type FlowQuestion } from "@/components/QuestionFlow";
import { audioForm, useRecorder } from "@/components/useRecorder";
import { finishPatternReviewAction, speakingDrillAction } from "@/app/actions/reviewActions";

interface Props {
  patternId: string;
  name: string;
  hint: string;
  format: string;
  drills: FlowQuestion[];
}

export default function ReviewBlock(p: Props) {
  const router = useRouter();
  const next = <Button className="mt-3 w-full" onClick={() => router.refresh()}>Lanjut</Button>;
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-4">
        <p className="text-xs uppercase tracking-wide text-amber-400">Review · {p.name}</p>
        <p className="text-sm text-slate-300">{p.hint}</p>
      </div>
      {p.format === "speaking"
        ? <SpeakingDrills drills={p.drills} onFinish={() => finishPatternReviewAction(p.patternId)} endAction={next} />
        : <QuestionFlow questions={p.drills} onFinish={() => { void finishPatternReviewAction(p.patternId); }} endAction={next} />}
    </section>
  );
}

function SpeakingDrills({ drills, onFinish, endAction }: { drills: FlowQuestion[]; onFinish: () => void; endAction: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; wpm: number; fillers: number; words: number } | null>(null);
  const [passed, setPassed] = useState(0);
  const r = useRecorder(60);

  if (i >= drills.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-bold text-white">Selesai</h2>
        <p className="text-slate-300">Lulus {passed} dari {drills.length} drill.</p>
        {endAction}
      </div>
    );
  }

  async function submit() {
    if (!r.audio) return;
    setBusy(true);
    const res = await speakingDrillAction(audioForm(drills[i].id, r.audio));
    setBusy(false);
    if ("error" in res) { r.setError(res.error ?? "Gagal."); return; }
    setResult({ passed: res.passed, wpm: res.metrics.wpm, fillers: res.metrics.fillers, words: res.metrics.words });
    if (res.passed) setPassed(n => n + 1);
  }

  function next() {
    if (i + 1 >= drills.length) onFinish();
    setI(i + 1); setResult(null); r.reset();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">Drill {i + 1} dari {drills.length}</p>
      <p className="text-lg font-semibold text-white">{drills[i].prompt}</p>
      {!result && (
        r.recording
          ? <Button className="w-full bg-rose-600" onClick={r.stop}>■ Stop ({r.seconds} dtk)</Button>
          : r.audio
            ? <div className="space-y-2">
                <audio controls src={URL.createObjectURL(r.audio)} className="w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={r.reset} disabled={busy}>Rekam ulang</Button>
                  <Button onClick={submit} disabled={busy}>{busy ? "Memeriksa…" : "Kirim"}</Button>
                </div>
              </div>
            : <Button className="w-full" onClick={r.start}>🎙 Rekam jawaban</Button>
      )}
      {r.error && <p role="alert" className="text-sm text-rose-300">{r.error}</p>}
      {result && (
        <div role="status" className={`rounded-lg p-3 text-sm ${result.passed ? "bg-emerald-950 text-emerald-100" : "bg-rose-950 text-rose-100"}`}>
          <p className="font-semibold">{result.passed ? "Lulus." : "Belum lulus."}</p>
          <p>{result.words} kata · {result.wpm} kata/menit · {result.fillers} filler</p>
          <Button className="mt-2 w-full" onClick={next}>Lanjut</Button>
        </div>
      )}
    </div>
  );
}
