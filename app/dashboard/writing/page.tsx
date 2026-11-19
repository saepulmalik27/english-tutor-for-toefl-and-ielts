import Link from "next/link";
import { connection } from "next/server";
import { PenToolIcon } from "lucide-react";
import { db } from "@/lib/db";
import WritingTask from "@/components/WritingTask";
import { WRITING, type WritingKind } from "@/lib/writing/score";

export default async function WritingPage({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  await connection();
  const kind: WritingKind = (await searchParams).task === "t2" ? "writing_t2" : "writing_t1";
  const item = await db.question.findFirst({
    where: { kind, status: "active", writingAttempts: { none: {} } },
    orderBy: { createdAt: "asc" },
    select: { id: true, prompt: true, options: true },
  });
  const history = await db.writingAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, band: true, wordCount: true, createdAt: true, question: { select: { kind: true, prompt: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-white">
        <PenToolIcon className="size-8 text-emerald-400" />
        <span>Writing</span>
      </h1>
      <nav className="flex gap-2" aria-label="Pilih tugas">
        {(["writing_t1", "writing_t2"] as const).map(k => (
          <Link key={k} href={`/dashboard/writing?task=${k === "writing_t1" ? "t1" : "t2"}`} aria-current={k === kind ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${k === kind ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400"}`}>
            {WRITING[k].label} {k === "writing_t1" ? "(surat)" : "(esai)"}
          </Link>
        ))}
      </nav>

      {item ? (
        <WritingTask key={item.id} item={{
          id: item.id, prompt: item.prompt, bullets: item.options as string[] | null,
          label: WRITING[kind].label, minWords: WRITING[kind].minWords,
        }} />
      ) : (
        <p className="py-8 text-center text-slate-500">Belum ada soal {WRITING[kind].label}. Job malam akan menyiapkannya.</p>
      )}

      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">Riwayat</h2>
          <ul className="divide-y divide-slate-900 rounded-xl border border-slate-800">
            {history.map(h => (
              <li key={h.id}>
                <Link href={`/dashboard/writing/${h.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-900/60">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white">{h.question.prompt}</span>
                    <span className="text-xs text-slate-500">
                      {WRITING[h.question.kind as WritingKind].label} · {h.wordCount} kata · {h.createdAt.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-violet-300">{Math.max(0, h.band - 1)}–{Math.min(9, h.band + 1)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
