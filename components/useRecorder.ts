"use client";
// Microphone recording shared by Speaking Tasks and speaking drills: timer, auto-stop at the limit,
// and a 32 kbps bitrate so a 2-minute answer stays around 0.5 MB (upload limit 3 MB).
import { useEffect, useRef, useState } from "react";

export function useRecorder(maxSeconds: number, onStopped?: () => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const rec = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= maxSeconds) rec.current?.stop(); // IELTS time limit
  }, [recording, seconds, maxSeconds]);

  async function start() {
    setError("");
    setAudio(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32_000 });
      const chunks: Blob[] = [];
      r.ondataavailable = e => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setAudio(new Blob(chunks, { type: r.mimeType }));
        setRecording(false);
        onStopped?.();
      };
      r.start();
      rec.current = r;
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Mikrofon tidak bisa dipakai. Izinkan akses mikrofon di browser.");
    }
  }

  return { recording, seconds, audio, error, setError, start, stop: () => rec.current?.stop(), reset: () => setAudio(null) };
}

/** FormData for an upload: the server reads questionId and audio. */
export function audioForm(questionId: string, audio: Blob) {
  const form = new FormData();
  form.append("questionId", questionId);
  form.append("audio", audio, "answer");
  return form;
}
