"use client";

import { useState } from "react";
import { generatePersonalizedContentAction } from "@/app/actions/generatorActions";
import { Button } from "@/components/ui/button";
import { SparklesIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function GenerateSessionButton() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const loadingToastId = toast.loading("Tutor AI sedang menyusun materi kustom, penjelasan tata bahasa, dan kuis baru sesuai kelemahan belajar Anda...");

    try {
      // Fetch user's local API settings from localStorage
      const localApiKey = localStorage.getItem("english_tutor_ai_api_key") || "";
      
      const res = await generatePersonalizedContentAction(localApiKey);
      
      if (res.success && res.articleId) {
        toast.success("Berhasil! Sesi belajar personal Anda siap dipelajari.", { id: loadingToastId });
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat sesi belajar kustom.", { id: loadingToastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi saat menghubungi Tutor AI.", { id: loadingToastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-violet-600/10 transition-all cursor-pointer"
    >
      {isGenerating ? (
        <>
          <RefreshCwIcon className="size-4 animate-spin" />
          <span>Sedang Menyusun Sesi...</span>
        </>
      ) : (
        <>
          <SparklesIcon className="size-4 animate-pulse fill-white/20" />
          <span>Rancang Sesi Belajar Kustom Baru</span>
        </>
      )}
    </Button>
  );
}
