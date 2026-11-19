import { connection } from "next/server";
import { MicIcon } from "lucide-react";
import SpeakingTask from "@/components/SpeakingTask";
import { nextSpeakingItem } from "@/lib/speaking/next";

export default async function SpeakingPage() {
  await connection();
  const item = await nextSpeakingItem();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-white">
        <MicIcon className="size-8 text-violet-400" />
        <span>Speaking</span>
      </h1>
      {item ? <SpeakingTask key={item.id} item={item} /> : (
        <p className="py-12 text-center text-slate-500">Belum ada soal Speaking. Job malam akan menyiapkannya.</p>
      )}
    </div>
  );
}
