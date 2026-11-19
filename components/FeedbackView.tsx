"use client";
// Feedback screen from prototype variant A, shared by Speaking and Writing: band range, one card per
// criterion, the learner's text with tappable mistakes, and patterns that have no quote.
import { useState } from "react";
import type { NamedSegments } from "@/lib/patterns/cards";

export interface FeedbackViewProps extends NamedSegments {
  title: string;                                   // e.g. "Perkiraan band Speaking"
  band: { low: number; high: number };
  summary: string;
  criteria: { name: string; band: number | null; note: string }[];
  textLabel: string;                               // "Transkrip" or "Tulisanmu"
  footer?: React.ReactNode;
}

export default function FeedbackView(p: FeedbackViewProps) {
  const [open, setOpen] = useState<number | null>(null);
  const openSeg = open !== null ? p.segments[open] : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-violet-950 p-4">
        <p className="text-sm text-violet-300">{p.title}</p>
        <p className="text-3xl font-bold text-white">{p.band.low} – {p.band.high}</p>
        <p className="text-xs text-violet-300">Rentang ±1 karena penilaian AI belum seakurat penguji.</p>
      </div>
      {p.summary && <p className="text-slate-200">{p.summary}</p>}
      {p.criteria.map(c => (
        <div key={c.name} className="rounded-lg border border-slate-800 p-3">
          <div className="flex justify-between font-semibold text-white"><span>{c.name}</span><span>{c.band ?? "—"}</span></div>
          <p className="text-sm text-slate-400">{c.note}</p>
        </div>
      ))}
      {p.footer}
      <div>
        <p className="mb-1 text-sm text-slate-400">{p.textLabel} · ketuk bagian merah</p>
        <p className="whitespace-pre-wrap rounded-lg bg-slate-900 p-3 leading-7 text-slate-200">
          {p.segments.map((s, i) => typeof s === "string" ? <span key={i}>{s}</span> : (
            <button key={i} type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}
              className="inline rounded bg-rose-900/60 px-1 text-left underline decoration-rose-400 [box-decoration-break:clone]">{s.text}</button>
          ))}
        </p>
        {openSeg && typeof openSeg !== "string" && (
          <div className="mt-2 rounded-lg border border-rose-800 p-3 text-sm">
            <p><b>{openSeg.tag.name}</b>: <s className="text-slate-400">{openSeg.tag.quote}</s>{openSeg.tag.fix && <> → <b className="text-emerald-400">{openSeg.tag.fix}</b></>}</p>
            <p className="text-slate-300">{openSeg.tag.note || openSeg.tag.hint}</p>
          </div>
        )}
      </div>
      {p.unplaced.length > 0 && (
        <ul className="space-y-2">
          {p.unplaced.map((t, i) => (
            <li key={i} className="rounded-lg border border-slate-800 p-3 text-sm">
              <b className="text-white">{t.name}</b>{t.fix && <> · <span className="text-emerald-400">{t.fix}</span></>}
              <p className="text-slate-400">{t.note || t.hint}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
