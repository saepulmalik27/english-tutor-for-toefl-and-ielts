import { getJournalHistoryAction } from "@/app/actions/tutorActions";
import WritingEditor from "@/components/WritingEditor";
import { PenToolIcon } from "lucide-react";

export default async function WritingPage() {

  const history = await getJournalHistoryAction();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <PenToolIcon className="size-8 text-violet-400" />
          <span>70% Latihan Menulis (Writing Gym)</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Latih kemampuan menulis essay dan jurnal harian Anda. Tulis tanggapan untuk salah satu prompt di bawah, lalu dapatkan evaluasi tata bahasa serta estimasi band IELTS/TOEFL Writing Anda secara otomatis.
        </p>
      </div>

      <WritingEditor initialHistory={history} />
    </div>
  );
}
