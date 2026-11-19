"use client";
// Onboarding (PRD v2): a welcome and a microphone check, then straight into the first Practice Session.
// No diagnostic test: the first week's rotation gives every section its first band estimate.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { finishOnboardingAction } from "@/app/actions/sessionActions";

export default function Welcome() {
  const router = useRouter();
  const [mic, setMic] = useState<"unknown" | "ok" | "blocked">("unknown");
  const [busy, setBusy] = useState(false);

  async function checkMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMic("ok");
    } catch {
      setMic("blocked");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-slate-950 px-4 text-slate-100">
      <h1 className="text-3xl font-extrabold text-white">Selamat datang 👋</h1>
      <p className="text-slate-300">
        Setiap hari ada satu sesi 30 menit: Speaking, lalu Reading atau Writing, lalu review kelemahanmu.
        Minggu pertama mencoba semua Skill supaya aplikasi tahu band awalmu di setiap section.
      </p>
      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="font-semibold text-white">Mikrofon</p>
        <p className="text-sm text-slate-400">Speaking butuh izin mikrofon. Rekaman hanya dipakai untuk penilaian dan tidak disimpan.</p>
        {mic === "ok" ? <p className="text-sm text-emerald-400">✓ Mikrofon siap.</p>
          : <Button variant="outline" onClick={checkMic}>Izinkan mikrofon</Button>}
        {mic === "blocked" && <p role="alert" className="text-sm text-rose-300">Mikrofon diblokir. Izinkan di pengaturan browser, lalu coba lagi.</p>}
      </div>
      <Button size="lg" disabled={busy} onClick={async () => { setBusy(true); await finishOnboardingAction(); router.push("/dashboard/session"); }}>
        Mulai sesi pertama
      </Button>
    </main>
  );
}
