import Link from "next/link";
import { FlameIcon } from "lucide-react";
import { db } from "@/lib/db";
import { wibDay } from "@/lib/bands";
import { getLearner } from "@/lib/learner";
import { weaknessProfile } from "@/lib/patterns/record";
import { groqQuota, practiceStreak, sectionBands } from "@/lib/progress";
import { MIN_SAMPLES, type Section } from "@/lib/bands";

const SECTIONS: { id: Section; name: string }[] = [
  { id: "listening", name: "Listening" },
  { id: "reading", name: "Reading" },
  { id: "writing", name: "Writing" },
  { id: "speaking", name: "Speaking" },
];

export default async function DashboardPage() {
  await getLearner();
  const [{ bands, lowest }, weaknesses, streak, quota, today] = await Promise.all([
    sectionBands(), weaknessProfile().then(w => w.slice(0, 5)), practiceStreak(), groqQuota(),
    db.practiceSession.findUnique({ where: { day: wibDay(new Date()) }, select: { step: true, completedAt: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Halo!</h1>
          <p className="text-sm text-slate-400">Target: IELTS General Training 7 di setiap section (batas aman 6).</p>
        </div>
        <p className="flex items-center gap-2 rounded-full border border-amber-900/50 bg-amber-950/30 px-3 py-1 text-sm font-semibold text-amber-400">
          <FlameIcon className="size-4" /> {streak} hari berturut-turut
        </p>
      </div>

      <Link href="/dashboard/session"
        className={`block rounded-2xl p-5 text-center text-lg font-bold ${today?.completedAt ? "border border-emerald-800 bg-emerald-950/40 text-emerald-300" : "bg-violet-600 text-white"}`}>
        {today?.completedAt ? "Sesi hari ini selesai ✓" : today && today.step > 0 ? "Lanjutkan sesi hari ini" : "Mulai sesi hari ini · 30 menit"}
      </Link>

      {/* Band estimate per section (PRD v2: always a range) */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Perkiraan band per section</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SECTIONS.map(s => {
            const b = bands[s.id];
            const isLowest = s.id === lowest;
            return (
              <div key={s.id} className={`rounded-2xl border p-4 ${isLowest ? "border-rose-700 bg-rose-950/30" : "border-slate-800 bg-slate-900/30"}`}>
                <p className="text-sm text-slate-400">{s.name}{isLowest && <span className="ml-1 font-semibold text-rose-300">· terendah</span>}</p>
                {b ? (
                  <>
                    <p className="text-2xl font-black text-white">{b.low} – {b.high}</p>
                    <p className="text-xs text-slate-500">
                      dari {b.samples} {s.id === "reading" ? "jawaban" : "tugas"} terakhir
                      {b.samples < MIN_SAMPLES[s.id] && <span className="block text-amber-400">data masih sedikit</span>}
                    </p>
                  </>
                ) : (
                  <p className="pt-1 text-sm text-slate-500">{s.id === "listening" ? "Belum ada di aplikasi" : "Belum ada data"}</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">Reading ±0.5, Writing dan Speaking ±1 (penilaian AI). Writing Task 2 dihitung dua kali, seperti di tes asli.</p>
      </section>

      {/* Top Error Patterns (Weakness Profile, last 30 days) */}
      <section className="space-y-3 rounded-2xl border border-slate-900 bg-slate-900/20 p-6">
        <h2 className="text-xl font-bold text-white">Kelemahan teratas (30 hari)</h2>
        {weaknesses.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada data. Kelemahan muncul di sini setelah kamu menjawab soal.</p>
        ) : (
          <ol className="space-y-2">
            {weaknesses.map(w => (
              <li key={w.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <span>
                  <span className="block font-semibold text-white">{w.name}</span>
                  <span className="text-xs text-slate-400">{w.hint}</span>
                </span>
                <span className="shrink-0 text-right text-xs text-slate-400">
                  <span className="block text-base font-bold text-rose-300">{w.count}×</span>
                  ingatan {Math.round(w.retrievability * 100)}%
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Free-tier quota left today (from Groq's rate-limit headers) */}
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">Kuota AI hari ini (Groq)</h2>
        {quota.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada panggilan AI hari ini.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {quota.map(q => (
              <li key={q.source} className="rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
                <span className="font-semibold text-white">{q.source}</span>: sisa {q.remaining} dari {q.limit} permintaan
                <span className="block text-xs text-slate-500">
                  per {q.updatedAt.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB{q.source === "Chat" ? " · cadangan Cloudflare dipakai otomatis saat habis" : " · tanpa cadangan"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
