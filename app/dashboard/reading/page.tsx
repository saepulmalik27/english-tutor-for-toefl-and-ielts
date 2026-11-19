import Link from "next/link";
import { connection } from "next/server";
import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import { db } from "@/lib/db";

export default async function ReadingPage() {
  await connection(); // the bank changes nightly: never prerender
  const passages = await db.passage.findMany({
    // only passages that are ready to practise
    where: { status: "active", questions: { some: { status: "active" } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, kind: true, wordCount: true, _count: { select: { questions: { where: { status: "active" } } } } },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-white">
          <BookOpenIcon className="size-8 text-emerald-400" />
          <span>Reading</span>
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Passage bergaya IELTS Reading Section 3 dari Wikipedia, masing-masing dengan 13 soal.
        </p>
      </div>

      {passages.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Belum ada passage dengan soal. Job malam akan menyiapkannya.</p>
      ) : (
        <ul className="divide-y divide-slate-900 rounded-2xl border border-slate-800 bg-slate-900/30">
          {passages.map(p => (
            <li key={p.id}>
              <Link href={`/dashboard/reading/${p.id}`} className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-900/60">
                <span>
                  <span className="block font-semibold text-white">{p.title}</span>
                  <span className="text-xs text-slate-500">{p.wordCount} kata · {p._count.questions} soal</span>
                </span>
                <ArrowRightIcon className="size-4 text-emerald-400 transition group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
