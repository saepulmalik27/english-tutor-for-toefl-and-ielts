// PROTOTYPE (ticket 10): fake data for one Practice Session. Throw away after the verdict.
"use client";
import { useEffect, useRef, useState } from "react";

export const speaking = {
  part: "Part 2",
  cue: "Describe a piece of technology you use every day.",
  bullets: ["what it is", "how often you use it", "what you use it for", "and explain why it is important to you"],
  prepSeconds: 60,
  speakSeconds: 120,
};

export const speakingFeedback = {
  band: { mid: 6, low: 5, high: 7 },
  criteria: [
    { id: "FC", name: "Fluency & Coherence", band: 6, note: "Alur jelas, tapi ada 3 jeda panjang (>2 detik) dan 9 filler \"um\"." },
    { id: "LR", name: "Lexical Resource", band: 6.5, note: "Kosakata teknologi cukup luas; \"very very useful\" diulang." },
    { id: "GRA", name: "Grammar Range & Accuracy", band: 5.5, note: "Sering salah bentuk past tense saat bercerita." },
    { id: "P", name: "Pronunciation", band: null, note: "Belum dinilai di MVP." },
  ],
  // segments: plain text, or an error tagged with an Error Pattern
  transcript: [
    "I use my laptop every day because I am a software engineer. ",
    { wrong: "Yesterday I go", fix: "Yesterday I went", pattern: "GRA.tense-form" },
    " to ",
    { wrong: "a office", fix: "an office", pattern: "GRA.articles" },
    " and, um, I write code for eight hours. It is ",
    { wrong: "very very useful", fix: "extremely useful", pattern: "LR.repetition" },
    " because, um, without it I cannot work from home.",
  ] as (string | { wrong: string; fix: string; pattern: string })[],
  metrics: { wpm: 108, longPauses: 3, fillers: 9 },
};

export const patterns: Record<string, { name: string; why: string }> = {
  "GRA.tense-form": { name: "Bentuk past tense", why: "Untuk kejadian kemarin pakai bentuk lampau: go → went, write → wrote." },
  "GRA.articles": { name: "Artikel a/an", why: "Pakai \"an\" sebelum bunyi vokal: an office, an hour." },
  "LR.repetition": { name: "Pengulangan kata", why: "Penguji menilai variasi kosakata; ganti pengulangan dengan kata yang lebih kuat." },
  "R.not-given": { name: "False vs Not Given", why: "False = teks menyatakan kebalikannya. Not Given = teks tidak membahasnya sama sekali." },
};

export const reading = {
  title: "Riverside Community Pool – Notice to members",
  text: `From 1 March, the pool will open at 6 a.m. on weekdays instead of 7 a.m. Weekend opening hours stay the same.

Members must now book lane swimming online at least 24 hours in advance. Bookings can be cancelled free of charge up to two hours before the session.

The café will close for renovation during March. Vending machines will be available in the main hall.

Children under 8 must be accompanied by an adult at all times.`,
  questions: [
    { n: 1, kind: "TFNG", q: "The pool will open earlier on Saturdays from 1 March.", answer: "FALSE", pattern: "R.not-given" },
    { n: 2, kind: "TFNG", q: "Lane swimming must be booked one day ahead.", answer: "TRUE", pattern: "R.not-given" },
    { n: 3, kind: "TFNG", q: "The renovation of the café will cost more than expected.", answer: "NOT GIVEN", pattern: "R.not-given" },
    { n: 4, kind: "TFNG", q: "Members pay a fee if they cancel one hour before.", answer: "TRUE", pattern: "R.not-given" },
    { n: 5, kind: "GAP", q: "During March, members can buy snacks from ______ in the main hall. (NO MORE THAN TWO WORDS)", answer: "VENDING MACHINES", pattern: "R.word-limit" },
  ],
};

export const review = [
  {
    pattern: "GRA.tense-form",
    drills: [
      { q: "Last week she ___ (take) the train to Sydney.", answer: "took" },
      { q: "I ___ (write) three emails yesterday.", answer: "wrote" },
      { q: "When we arrived, the shop ___ (close) already.", answer: "had closed" },
    ],
  },
  {
    pattern: "R.not-given",
    drills: [
      { q: "Text: \"The library opens at 9.\" — Claim: The library is free.", answer: "NOT GIVEN" },
      { q: "Text: \"Parking is not allowed.\" — Claim: You may park here.", answer: "FALSE" },
      { q: "Text: \"Tickets cost $5.\" — Claim: Tickets are $5.", answer: "TRUE" },
    ],
  },
];

export const TFNG = ["TRUE", "FALSE", "NOT GIVEN"];

export const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

// Real microphone recording so the speaking step feels real; feedback stays fake.
export function useRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = e => chunks.push(e.data);
      r.onstop = () => { setUrl(URL.createObjectURL(new Blob(chunks))); stream.getTracks().forEach(t => t.stop()); };
      r.start(); rec.current = r;
    } catch { /* no mic: still let the flow continue */ }
    setSeconds(0); setState("recording");
  }
  function stop() { rec.current?.stop(); setState("done"); }
  return { state, url, seconds, start, stop };
}

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
