"use client";
// Prototype variant A (ticket 10) for one Speaking Task: prepare (Part 2) → record → play back → Feedback.
import { useEffect, useState } from "react";
import { audioForm, useRecorder } from "@/components/useRecorder";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitSpeakingAction } from "@/app/actions/speakingActions";
import FeedbackView from "@/components/FeedbackView";
import AdvanceButton from "@/components/AdvanceButton";

interface Item { id: string; kind: string; prompt: string; options: string[] | null }
type Result = Extract<Awaited<ReturnType<typeof submitSpeakingAction>>, { scores: unknown }>;

const PART: Record<string, { label: string; prepSeconds: number; maxSeconds: number }> = {
  speaking_p1: { label: "Part 1", prepSeconds: 0, maxSeconds: 60 },
  speaking_p2: { label: "Part 2", prepSeconds: 60, maxSeconds: 120 },
  speaking_p3: { label: "Part 3", prepSeconds: 0, maxSeconds: 90 },
};
const CRITERIA = [
  { id: "FC", name: "Fluency & Coherence" },
  { id: "LR", name: "Lexical Resource" },
  { id: "GRA", name: "Grammatical Range & Accuracy" },
] as const;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function SpeakingTask({ item, sessionStep }: { item: Item; sessionStep?: number }) {
  const part = PART[item.kind];
  const router = useRouter();
  const [phase, setPhase] = useState<"prep" | "record" | "review" | "scoring" | "done">(part.prepSeconds ? "prep" : "record");
  const [prepLeft, setPrepLeft] = useState(part.prepSeconds);
  const [result, setResult] = useState<Result | null>(null);
  const { recording, seconds, audio, error, setError, start, stop, reset } = useRecorder(part.maxSeconds, () => setPhase("review"));

  useEffect(() => {
    if (phase !== "prep" || prepLeft <= 0) return;
    const t = setTimeout(() => setPrepLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, prepLeft]);

  async function submit() {
    if (!audio) return;
    setPhase("scoring");
    const res = await submitSpeakingAction(audioForm(item.id, audio));
    if ("error" in res) { setError(res.error ?? "Gagal."); setPhase("review"); return; }
    setResult(res);
    setPhase("done");
  }

  return (
    <section className="space-y-4">
      <p className="text-xs uppercase tracking-wide text-violet-400">{part.label}</p>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="font-semibold text-white">{item.prompt}</p>
        {item.options && (
          <>
            <p className="mt-2 text-sm text-slate-400">You should say:</p>
            <ul className="ml-5 list-disc text-sm text-slate-300">{item.options.map(b => <li key={b}>{b}</li>)}</ul>
          </>
        )}
      </div>

      {phase === "prep" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Persiapan: <b className="font-mono text-white">{mmss(prepLeft)}</b>. Boleh membuat catatan.</p>
          <textarea aria-label="Catatan" className="h-28 w-full rounded-xl bg-slate-900 p-3 text-sm text-white" placeholder="Catatan (tidak dikirim)…" />
          <Button className="w-full" size="lg" onClick={() => setPhase("record")}>Saya siap bicara</Button>
        </div>
      )}

      {phase === "record" && (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <p className="font-mono text-5xl text-white">{mmss(seconds)} <span className="text-base text-slate-500">/ {mmss(part.maxSeconds)}</span></p>
          {recording
            ? <button onClick={stop} className="size-28 animate-pulse rounded-full bg-rose-500 text-lg font-bold text-white">Stop</button>
            : <button onClick={start} className="size-28 rounded-full bg-rose-600 text-lg font-bold text-white shadow-lg">Rekam</button>}
        </div>
      )}

      {phase === "review" && audio && (
        <div className="space-y-3">
          <audio controls src={URL.createObjectURL(audio)} className="w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { reset(); setPhase("record"); }}>Rekam ulang</Button>
            <Button onClick={submit}>Kirim untuk dinilai</Button>
          </div>
        </div>
      )}

      {phase === "scoring" && <p className="py-6 text-center text-slate-400">Menilai jawabanmu… (±20 detik)</p>}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

      {phase === "done" && result && (
        <div className="space-y-4">
          <FeedbackView
            title="Perkiraan band Speaking" band={result.band} summary={result.feedback.summary}
            criteria={[
              ...CRITERIA.map(c => ({ name: c.name, band: result.scores[c.id].band, note: result.feedback.criteria[c.id] })),
              { name: "Pronunciation", band: null, note: "Belum dinilai di MVP." },
            ]}
            segments={result.segments} unplaced={result.unplaced} textLabel="Transkrip"
            footer={<p className="text-xs text-slate-500">{result.metrics.wpm} kata/menit · {result.metrics.longPauses} jeda panjang · {result.metrics.fillers} filler</p>}
          />
          {sessionStep !== undefined
            ? <AdvanceButton step={sessionStep} />
            : <Button className="w-full" size="lg" onClick={() => router.refresh()}>Soal berikutnya</Button>}
        </div>
      )}
    </section>
  );
}
