import { connection } from "next/server";
import { RotateCcwIcon } from "lucide-react";
import ReviewBlock from "@/components/ReviewBlock";
import { patternById } from "@/lib/patterns/taxonomy";
import { currentReview } from "@/lib/review/store";

export default async function ReviewPage() {
  await connection();
  const { current, waiting, capReached } = await currentReview();
  const pattern = current && patternById(current.patternId);
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-white">
        <RotateCcwIcon className="size-8 text-amber-400" />
        <span>Review</span>
      </h1>
      {current && pattern ? (
        <ReviewBlock key={pattern.id} patternId={pattern.id} name={pattern.name} hint={pattern.hint} format={current.drills[0].type}
          drills={current.drills.map(d => ({ id: d.id, instructions: d.instructions, prompt: d.prompt, options: d.options as string[] | null }))} />
      ) : (
        <p className="py-8 text-center text-slate-400">
          {capReached ? "Review hari ini selesai. Lanjut besok." : "Tidak ada kelemahan yang jatuh tempo hari ini."}
        </p>
      )}
      {waiting.length > 0 && <p className="text-sm text-slate-500">Drill untuk {waiting.join(", ")} sedang disiapkan job malam.</p>}
    </div>
  );
}
