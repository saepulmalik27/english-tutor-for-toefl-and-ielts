"use client";
// Prototype variant A (ticket 10): one question per screen, Feedback right after each answer.
// Answer keys never reach the browser; the server checks each answer.
import { useState } from "react";
import { FlagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { answerQuestionAction, reportQuestionAction } from "@/app/actions/readingActions";

export interface FlowQuestion {
  id: string;
  instructions: string | null;
  prompt: string;
  options: string[] | null;
}

type Feedback = { correct: boolean; answer: string; explanation: string };

export default function QuestionFlow({ questions, onFinish, endAction }: {
  questions: FlowQuestion[];
  onFinish?: () => void;           // called once, after the last question
  endAction?: React.ReactNode;     // shown on the summary, e.g. "next pattern"
}) {
  const [i, setI] = useState(0);
  const [given, setGiven] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState({ right: 0, answered: 0, reported: 0 });

  if (i >= questions.length) {
    return (
      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-bold text-white">Selesai</h2>
        <p className="text-slate-300">Benar {score.right} dari {score.answered} soal.</p>
        {score.reported > 0 && <p className="text-sm text-slate-500">{score.reported} soal dilaporkan dan ditarik.</p>}
        {endAction}
      </section>
    );
  }

  const q = questions[i];
  const next = () => {
    if (i + 1 >= questions.length) onFinish?.();
    setI(i + 1); setGiven(""); setFeedback(null);
  };

  async function check(answer: string) {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setGiven(answer);
    const res = await answerQuestionAction(q.id, answer);
    setBusy(false);
    if ("error" in res) { next(); return; }
    setFeedback(res);
    setScore(s => ({ ...s, answered: s.answered + 1, right: s.right + (res.correct ? 1 : 0) }));
  }

  async function report() {
    setBusy(true);
    await reportQuestionAction(q.id);
    setBusy(false);
    setScore(s => ({ ...s, reported: s.reported + 1 }));
    next();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
      <div className="h-1.5 rounded bg-slate-800">
        <div className="h-1.5 rounded bg-emerald-500 transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-400">Soal {i + 1} dari {questions.length}</p>
      {q.instructions && <p className="text-sm text-slate-400">{q.instructions}</p>}
      <p className="text-lg font-semibold text-white">{q.prompt}</p>

      {q.options ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map(o => (
            <Button key={o} variant={given === o ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-2 text-left"
              disabled={busy || !!feedback} onClick={() => check(o)}>{o}</Button>
          ))}
        </div>
      ) : (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); check(given); }}>
          <input aria-label="Jawaban" className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-white"
            value={given} disabled={busy || !!feedback} onChange={e => setGiven(e.target.value)} />
          <Button type="submit" disabled={busy || !!feedback || !given.trim()}>Cek</Button>
        </form>
      )}

      {feedback && (
        <div role="status" className={`space-y-1 rounded-lg p-3 text-sm ${feedback.correct ? "bg-emerald-950 text-emerald-100" : "bg-rose-950 text-rose-100"}`}>
          <p className="font-semibold">{feedback.correct ? "Benar." : <>Kurang tepat. Jawaban: {feedback.answer}</>}</p>
          {feedback.explanation && <p>{feedback.explanation}</p>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={report} disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-300 disabled:opacity-50">
          <FlagIcon className="size-3.5" /> Laporkan soal jelek
        </button>
        {feedback && <Button onClick={next}>Lanjut</Button>}
      </div>
    </section>
  );
}
