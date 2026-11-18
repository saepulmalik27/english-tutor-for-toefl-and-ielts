"use client";
// Shows one passage with its attribution and browser TTS (PRD v2: speechSynthesis only).
import { useEffect, useState } from "react";
import { Volume2Icon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PassageView {
  title: string;
  body: string;
  wordCount: number;
  sourceUrl: string | null;
  license: string | null;
}

export default function PassageReader({ passage }: { passage: PassageView }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleSpeech = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(passage.body);
    u.lang = "en-GB";
    u.onend = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <article className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 sm:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{passage.title}</h1>
          <p className="text-xs text-slate-500">{passage.wordCount} kata · IELTS Reading Section 3</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleSpeech} aria-pressed={speaking}>
          {speaking ? <SquareIcon /> : <Volume2Icon />}
          {speaking ? "Stop" : "Dengarkan"}
        </Button>
      </header>
      <div className="space-y-4 text-[15px] leading-7 text-slate-200">
        {passage.body.split(/\n{2,}/).map((para, i) => {
          // A crawled section heading sits on the first line of its paragraph.
          const [first, ...rest] = para.split("\n");
          return rest.length
            ? <section key={i}><h2 className="font-semibold text-white">{first}</h2><p>{rest.join(" ")}</p></section>
            : <p key={i}>{para}</p>;
        })}
      </div>
      {passage.sourceUrl && (
        <footer className="border-t border-slate-800 pt-3 text-xs text-slate-500">
          Sumber: <a href={passage.sourceUrl} className="underline hover:text-slate-300" target="_blank" rel="noreferrer">
            “{passage.title}”, Wikipedia</a>{passage.license && <> · Lisensi {passage.license}</>}
        </footer>
      )}
    </article>
  );
}
