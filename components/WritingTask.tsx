"use client";
// One Writing Task: prompt, editor with a live word count against the IELTS minimum, submit → Feedback page.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitWritingAction } from "@/app/actions/writingActions";
import { advanceSessionAction } from "@/app/actions/sessionActions";

export interface WritingItem { id: string; prompt: string; bullets: string[] | null; label: string; minWords: number }

export default function WritingTask({ item, sessionStep }: { item: WritingItem; sessionStep?: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const words = text.split(/\s+/).filter(Boolean).length;

  async function submit() {
    setBusy(true);
    setError("");
    const res = await submitWritingAction(item.id, text);
    if ("error" in res) { setError(res.error ?? "Gagal."); setBusy(false); return; }
    if (sessionStep !== undefined) {
      await advanceSessionAction(sessionStep);
      router.push(`/dashboard/writing/${res.attemptId}?session=1`);
    } else router.push(`/dashboard/writing/${res.attemptId}`);
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-emerald-400">{item.label} · minimal {item.minWords} kata</p>
        <p className="whitespace-pre-wrap text-white">{item.prompt}</p>
        {item.bullets && (
          <>
            <p className="text-sm text-slate-400">In your letter:</p>
            <ul className="ml-5 list-disc text-sm text-slate-300">{item.bullets.map(b => <li key={b}>{b}</li>)}</ul>
          </>
        )}
      </div>
      <textarea aria-label="Tulisanmu" value={text} onChange={e => setText(e.target.value)} disabled={busy}
        className="h-80 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-[15px] leading-7 text-white" />
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm ${words >= item.minWords ? "text-emerald-400" : "text-slate-400"}`} aria-live="polite">
          {words} / {item.minWords} kata
        </p>
        <Button onClick={submit} disabled={busy || words === 0}>{busy ? "Menilai… (±30 detik)" : "Kirim untuk dinilai"}</Button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </section>
  );
}
