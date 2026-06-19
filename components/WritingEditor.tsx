"use client";

import { useState, useEffect } from "react";
import { submitJournalAction } from "@/app/actions/tutorActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  PenToolIcon, 
  SparklesIcon, 
  HelpCircleIcon, 
  HistoryIcon, 
  CheckCircle2Icon, 
  ArrowRightIcon, 
  KeyIcon,
  SettingsIcon
} from "lucide-react";
import { toast } from "sonner";
import { PROVIDERS } from "@/lib/ai";

interface JournalEntry {
  id: string;
  prompt: string;
  userText: string;
  feedback: string;
  score: number;
  ieltsBand: number;
  toeflScore: number;
  createdAt: Date;
}

interface WritingEditorProps {
  initialHistory: JournalEntry[];
}

const PRESET_PROMPTS = [
  {
    id: "prompt-1",
    title: "Childhood Memory (Basic)",
    text: "Describe a happy childhood memory. Where were you, who were you with, and why was it memorable?",
    textIndo: "Ceritakan memori masa kecil yang bahagia. Di mana Anda saat itu, dengan siapa Anda, dan mengapa memori itu berkesan?"
  },
  {
    id: "prompt-2",
    title: "Technology & Daily Life (Intermediate)",
    text: "Some people think that technology makes our lives more complex rather than simpler. To what extent do you agree or disagree?",
    textIndo: "Sebagian orang berpikir bahwa teknologi membuat hidup kita lebih rumit daripada sederhana. Sejauh mana Anda setuju atau tidak setuju?"
  },
  {
    id: "prompt-3",
    title: "Environment Protection (Intermediate)",
    text: "Should governments charge people for using single-use plastic bags to help protect the environment? Why or why not?",
    textIndo: "Apakah pemerintah sebaiknya menarif kantong plastik sekali pakai untuk melindungi lingkungan? Mengapa atau mengapa tidak?"
  },
  {
    id: "prompt-4",
    title: "Artificial Intelligence Impact (Advanced)",
    text: "Identify the primary benefits and potential societal challenges posed by the rapid integration of artificial intelligence in work environments.",
    textIndo: "Identifikasi manfaat utama dan potensi tantangan sosial yang ditimbulkan oleh integrasi cepat kecerdasan buatan (AI) di lingkungan kerja."
  }
];

export default function WritingEditor({ initialHistory }: WritingEditorProps) {
  const [selectedPrompt, setSelectedPrompt] = useState(PRESET_PROMPTS[0]);
  const [userText, setUserText] = useState("");
  const [aiProvider, setAiProvider] = useState("gemini");
  const [aiModelName, setAiModelName] = useState("gemini-2.5-flash");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<JournalEntry[]>(initialHistory);
  const [activeFeedback, setActiveFeedback] = useState<{
    score: number;
    feedback: string;
    ieltsBand: number;
    toeflScore: number;
    xpGained: number;
  } | null>(null);

  // Load saved AI configurations from localStorage on component mount
  useEffect(() => {
    const oldKey = localStorage.getItem("english_tutor_gemini_api_key");
    const savedProvider = localStorage.getItem("english_tutor_ai_provider") || "gemini";
    const savedApiKey = localStorage.getItem("english_tutor_ai_api_key") || (savedProvider === "gemini" ? oldKey || "" : "");
    const savedModelName = localStorage.getItem("english_tutor_ai_model_name") || "gemini-2.5-flash";
    const savedBaseUrl = localStorage.getItem("english_tutor_ai_base_url") || "";

    setAiProvider(savedProvider);
    setAiApiKey(savedApiKey);
    setAiModelName(savedModelName);
    setAiBaseUrl(savedBaseUrl);
  }, []);

  const updateAiSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    if (key === "english_tutor_ai_provider") {
      setAiProvider(value);
      const meta = PROVIDERS.find(p => p.id === value);
      if (meta) {
        setAiModelName(meta.defaultModel);
        localStorage.setItem("english_tutor_ai_model_name", meta.defaultModel);
        const defUrl = meta.defaultBaseUrl || "";
        setAiBaseUrl(defUrl);
        localStorage.setItem("english_tutor_ai_base_url", defUrl);
      }
    } else if (key === "english_tutor_ai_model_name") {
      setAiModelName(value);
    } else if (key === "english_tutor_ai_api_key") {
      setAiApiKey(value);
    } else if (key === "english_tutor_ai_base_url") {
      setAiBaseUrl(value);
    }
  };

  // Word count calculator
  const getWordCount = () => {
    const cleanText = userText.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).length;
  };

  const wordCount = getWordCount();

  // Handle essay submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("prompt", selectedPrompt.text);
      formData.append("userText", userText);
      formData.append("aiProvider", aiProvider);
      formData.append("aiModelName", aiModelName);
      if (aiApiKey.trim()) {
        formData.append("aiApiKey", aiApiKey.trim());
      }
      if (aiBaseUrl.trim()) {
        formData.append("aiBaseUrl", aiBaseUrl.trim());
      }

      const res = await submitJournalAction(formData);
      if (res.success && res.feedback) {
        setActiveFeedback({
          score: res.score!,
          feedback: res.feedback,
          ieltsBand: res.ieltsBand!,
          toeflScore: res.toeflScore!,
          xpGained: res.xpGained!
        });

        // Prepend new entry locally to history log
        const newEntry: JournalEntry = {
          id: Math.random().toString(), // temp id
          prompt: selectedPrompt.text,
          userText: userText,
          feedback: res.feedback,
          score: res.score!,
          ieltsBand: res.ieltsBand!,
          toeflScore: res.toeflScore!,
          createdAt: new Date()
        };
        setHistory(prev => [newEntry, ...prev]);
        
        // Reset editor
        setUserText("");
        
        toast.success(`Berhasil! Jurnal terkirim. +${res.xpGained} XP!`);
      } else {
        alert(res.error || "Gagal mengirim jurnal.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper formatter for tutor markdown feedback
  const renderFeedbackMarkdown = (md: string) => {
    return md.split("\n").map((line, index) => {
      if (line.startsWith("### ")) {
        return <h3 key={index} className="text-lg font-bold text-white mt-4 mb-2">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("#### ")) {
        return <h4 key={index} className="text-sm font-bold text-violet-400 mt-3 mb-1.5">{line.replace("#### ", "")}</h4>;
      }
      if (line.startsWith("* **")) {
        const cleanLine = line.replace(/^\*\s+/, "");
        // simple bold highlighting
        const boldParts = cleanLine.split(/\*\*/g);
        return (
          <p key={index} className="text-xs text-slate-300 ml-4 mb-2 leading-relaxed">
            • {boldParts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part)}
          </p>
        );
      }
      if (line.startsWith("* ")) {
        return <p key={index} className="text-xs text-slate-300 ml-4 mb-2 leading-relaxed">• {line.replace(/^\*\s+/, "")}</p>;
      }
      if (line.trim() === "") return <div key={index} className="h-2" />;
      return <p key={index} className="text-xs text-slate-400 leading-relaxed mb-1.5">{line}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Editor & Prompt Section */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Prompt Selectors */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Pilih Prompt Latihan Menulis
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {PRESET_PROMPTS.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setActiveFeedback(null); // clear current feedback
                }}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedPrompt.id === prompt.id
                    ? "bg-violet-950/20 border-violet-500 text-violet-300 font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300"
                }`}
              >
                <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-1">{prompt.title}</div>
                <div className="line-clamp-2">{prompt.text}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* The Text Editor */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-900">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <PenToolIcon className="size-4.5 text-violet-400" />
              <span>Menulis Jurnal Essay Anda</span>
            </CardTitle>
            <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs leading-relaxed text-slate-300">
              <div className="font-bold text-violet-400 mb-1">Topik:</div>
              <p className="font-semibold text-white">"{selectedPrompt.text}"</p>
              <p className="text-slate-500 italic mt-1">Arti: "{selectedPrompt.textIndo}"</p>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              
              {/* Textarea */}
              <div className="space-y-1">
                <Textarea
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Tulis essay atau tulisan bahasa Inggris Anda di sini..."
                  className="min-h-72 border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-700 focus:border-violet-500 focus:ring-violet-500 text-sm leading-relaxed"
                  required
                />
                
                {/* Stats Bar */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-1">
                  <div>
                    Jumlah Kata:{" "}
                    <span className={wordCount < 10 ? "text-amber-500" : "text-emerald-400 font-bold"}>
                      {wordCount}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-1">
                      (Saran: 100+ kata untuk IELTS/TOEFL)
                    </span>
                  </div>
                  <div>
                    Karakter: {userText.length}
                  </div>
                </div>
              </div>

              {/* AI Provider Settings box */}
              <details className="group border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden">
                <summary className="cursor-pointer p-3 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 select-none">
                  <SettingsIcon className="size-3.5 text-violet-400" />
                  <span>Pengaturan AI Tutor (Pilih Provider & Model AI)</span>
                  <span className="ml-auto transition group-open:rotate-180 text-[10px]">▼</span>
                </summary>
                <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/80">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Tingkatkan kualitas koreksi dengan memilih penyedia AI pilihan Anda. Kunci API hanya disimpan secara lokal di browser Anda. Jika dibiarkan kosong, sistem akan beralih ke analisis gramatika offline bawaan.
                  </p>
                  
                  {/* Select AI Provider */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penyedia AI (AI Provider)</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => updateAiSetting("english_tutor_ai_provider", e.target.value)}
                      className="w-full rounded-md border border-slate-800 bg-slate-955 p-2 text-xs text-white bg-slate-950 focus:border-violet-500 focus:outline-none"
                    >
                      {PROVIDERS.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* API Key */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">API Key</label>
                    <Input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => updateAiSetting("english_tutor_ai_api_key", e.target.value)}
                      placeholder={PROVIDERS.find(p => p.id === aiProvider)?.placeholderApiKey || "Masukkan API Key"}
                      className="border-slate-800 bg-slate-950 text-xs"
                    />
                    <p className="text-[9px] text-slate-500">
                      {PROVIDERS.find(p => p.id === aiProvider)?.helperText}
                    </p>
                  </div>

                  {/* Model Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Model (Model Name)</label>
                    <Input
                      type="text"
                      value={aiModelName}
                      onChange={(e) => updateAiSetting("english_tutor_ai_model_name", e.target.value)}
                      placeholder="Contoh: gemini-2.5-flash, gpt-4o-mini"
                      className="border-slate-800 bg-slate-950 text-xs"
                    />
                  </div>

                  {/* Base URL (only show for Custom, or if defaultBaseUrl exists) */}
                  {(aiProvider === "custom" || PROVIDERS.find(p => p.id === aiProvider)?.defaultBaseUrl !== undefined) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base URL (API Endpoint)</label>
                      <Input
                        type="text"
                        value={aiBaseUrl}
                        onChange={(e) => updateAiSetting("english_tutor_ai_base_url", e.target.value)}
                        placeholder="Contoh: https://api.deepseek.com/v1"
                        className="border-slate-800 bg-slate-950 text-xs"
                      />
                      <p className="text-[9px] text-slate-500">
                        Biarkan kosong untuk menggunakan URL bawaan penyedia.
                      </p>
                    </div>
                  )}

                </div>
              </details>

            </CardContent>
            <CardFooter className="border-t border-slate-900/50 py-4">
              <Button
                type="submit"
                disabled={isSubmitting || !userText.trim() || wordCount < 3}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500 py-6"
              >
                {isSubmitting ? "Menganalisis Gramatika & Menghitung Skor..." : "Kirim Jurnal & Minta Umpan Balik"}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>

      {/* Sidebar: Feedback / History */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Active Feedback Card */}
        {activeFeedback && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-2xl rounded-full" />
            <CardHeader className="text-center pb-2 border-b border-slate-900">
              <div className="mx-auto bg-violet-950/40 border border-violet-900/50 text-violet-400 p-3 rounded-2xl size-12 flex items-center justify-center mb-3">
                <SparklesIcon className="size-6 animate-pulse" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Analisis Koreksi Tutor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              
              {/* Score indicators */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] uppercase text-slate-500 font-bold">Skor Tata Bahasa</div>
                  <div className="text-base font-black text-white">{activeFeedback.score}/100</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] uppercase text-violet-400 font-bold">IELTS Writing</div>
                  <div className="text-base font-black text-white">{activeFeedback.ieltsBand.toFixed(1)}</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] uppercase text-emerald-400 font-bold">TOEFL Writing</div>
                  <div className="text-base font-black text-white">{activeFeedback.toeflScore}</div>
                </div>
              </div>

              {/* Detailed Markdown feedback content */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs overflow-y-auto max-h-[35vh] space-y-2 pr-1">
                {renderFeedbackMarkdown(activeFeedback.feedback)}
              </div>

              {/* XP Awarded badge */}
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-800/40 p-2.5 rounded-xl text-[11px] text-emerald-300 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2Icon className="size-3.5" />
                <span>Umpan balik tersimpan! Dapatkan +{activeFeedback.xpGained} XP!</span>
              </div>

            </CardContent>
          </Card>
        )}

        {/* History Log Card */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader className="pb-3 border-b border-slate-900">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <HistoryIcon className="size-4 text-slate-400" />
              <span>Riwayat Jurnal Menulis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 max-h-[40vh] overflow-y-auto space-y-3 pr-2">
            {history.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Belum ada riwayat menulis. Kirim tulisan pertama Anda untuk memulai!
              </div>
            ) : (
              history.map((entry) => (
                <div 
                  key={entry.id}
                  onClick={() => {
                    // Load into active feedback view
                    setActiveFeedback({
                      score: entry.score,
                      feedback: entry.feedback,
                      ieltsBand: entry.ieltsBand,
                      toeflScore: entry.toeflScore,
                      xpGained: 0 // no new XP
                    });
                  }}
                  className="group cursor-pointer p-3 rounded-lg bg-slate-950 border border-slate-900 hover:border-slate-800 transition-all flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(entry.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short"
                      })}
                    </span>
                    <div className="flex gap-1.5">
                      <Badge className="bg-slate-900 text-violet-400 border border-slate-800 text-[8px] px-1 py-0 scale-90">
                        IELTS {entry.ieltsBand.toFixed(1)}
                      </Badge>
                      <Badge className="bg-slate-900 text-emerald-400 border border-slate-800 text-[8px] px-1 py-0 scale-90">
                        TOEFL {entry.toeflScore}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-semibold line-clamp-1 group-hover:text-white transition-all">
                    "{entry.prompt}"
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 italic">
                    "{entry.userText}"
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
