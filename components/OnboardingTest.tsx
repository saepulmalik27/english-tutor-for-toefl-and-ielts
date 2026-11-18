"use client";

import { useState } from "react";
import { submitOnboardingAction } from "@/app/actions/onboardingAction";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpenIcon, 
  PenToolIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon, 
  RocketIcon,
  CheckCircle2Icon
  } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OnboardingTest() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Steps: 1 (Welcome), 2 (Reading), 3 (Writing), 4 (Loading), 5 (Results)
  
  // Test State
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [essay, setEssay] = useState("");
  const [targetIeltsBand, setTargetIeltsBand] = useState(6.5);
  const [targetToeflScore, setTargetToeflScore] = useState(80);
  
  // Submission & Results State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState<{
    ieltsBand: number;
    toeflScore: number;
    level: string;
  } | null>(null);

  const getWordCount = () => {
    const cleanText = essay.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).length;
  };

  const wordCount = getWordCount();

  const handleOnboardingSubmit = async () => {
    if (!q1 || !q2 || !q3 || !essay.trim()) {
      setErrorMessage("Harap lengkapi semua jawaban tes sebelum mengirim.");
      return;
    }

    setStep(4); // Show loading screen
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await submitOnboardingAction({
        q1,
        q2,
        q3,
        essay,
        targetIeltsBand: Number(targetIeltsBand) || 6.5,
        targetToeflScore: Number(targetToeflScore) || 80
      });

      if (response.success && response.ieltsBand !== undefined) {
        setResults({
          ieltsBand: response.ieltsBand,
          toeflScore: response.toeflScore!,
          level: response.level!,
        });
        setStep(5); // Show results screen
        toast.success("Tes Onboarding selesai!");
      } else {
        setErrorMessage(response.error || "Gagal menyimpan hasil tes.");
        setStep(3); // Go back to writing step to review
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan koneksi saat memproses jawaban.");
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -z-10 size-96 rounded-full bg-violet-600/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 size-96 rounded-full bg-emerald-600/5 blur-3xl" />

      <div className="w-full max-w-xl">
        
        {/* Step Indicator */}
        {step < 4 && (
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Langkah {step} dari 3
            </span>
            <div className="flex gap-1.5 w-32">
              <Progress value={(step / 3) * 100} className="h-1.5 bg-slate-900 border border-slate-800" />
            </div>
          </div>
        )}

        {/* Step 1: Welcome & Setup */}
        {step === 1 && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-2xl size-12 flex items-center justify-center mb-3">
                <RocketIcon className="size-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-white">Tes Penaksiran Awal (Pre-Test)</CardTitle>
              <CardDescription className="text-slate-400">
                Sebelum mulai belajar, mari ukur tingkat pemahaman bahasa Inggris Anda untuk memberikan materi pelajaran yang lebih personal dan sesuai!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200">🔍 Apa saja isi pre-test ini?</h3>
                <ul className="space-y-2 text-xs text-slate-400 pl-4 list-disc">
                  <li>**Bagian 1: Membaca (Reading)** - Menjawab 3 kuis pilihan ganda singkat.</li>
                  <li>**Bagian 2: Menulis (Writing)** - Menulis perkenalan singkat dalam bahasa Inggris (min. 10 kata).</li>
                </ul>
              </div>

              {/* Target Score Settings */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpenIcon className="size-4 text-violet-400" />
                  <span>Target Skor Belajar Anda (IELTS / TOEFL)</span>
                </label>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tentukan target skor yang ingin Anda capai. AI Tutor akan secara otomatis menyesuaikan tingkat kesulitan materi dan kuis kustom harian untuk membantu Anda mencapainya.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300">Target IELTS Band</label>
                    <select
                      value={targetIeltsBand}
                      onChange={(e) => setTargetIeltsBand(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    >
                      {[4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((val) => (
                        <option key={val} value={val}>
                          IELTS {val.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300">Target TOEFL iBT</label>
                    <select
                      value={targetToeflScore}
                      onChange={(e) => setTargetToeflScore(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    >
                      {[40, 50, 60, 70, 80, 90, 100, 110, 120].map((val) => (
                        <option key={val} value={val}>
                          TOEFL {val}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>


            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500"
              >
                Mulai Pre-Test <ArrowRightIcon className="size-4" data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Reading Section (3 Questions) */}
        {step === 2 && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpenIcon className="size-5.5 text-emerald-400" />
                <span>Bagian 1: Pemahaman & Tata Bahasa</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Pilihlah kata yang paling tepat untuk melengkapi kalimat-kalimat bahasa Inggris di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Q1 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  1. He _____ to school yesterday. (Basic)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["go", "goes", "went", "going"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setQ1(opt)}
                      className={`p-2.5 text-xs rounded-lg border text-left transition-all ${
                        q1 === opt 
                          ? "bg-violet-950/20 border-violet-500 text-violet-300 font-bold" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  2. Although she was tired, she _____ working on her assignment. (Intermediate)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["continues", "continued", "is continuing", "had continued"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setQ2(opt)}
                      className={`p-2.5 text-xs rounded-lg border text-left transition-all ${
                        q2 === opt 
                          ? "bg-violet-950/20 border-violet-500 text-violet-300 font-bold" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  3. By the time the manager arrived, the reports _____ by the team. (Advanced)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["had been finished", "were finished", "have been finished", "finished"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setQ3(opt)}
                      className={`p-2.5 text-xs rounded-lg border text-left transition-all ${
                        q3 === opt 
                          ? "bg-violet-950/20 border-violet-500 text-violet-300 font-bold" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between gap-4 border-t border-slate-900/50 pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-white">
                <ArrowLeftIcon className="size-4" data-icon="inline-start" /> Kembali
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!q1 || !q2 || !q3}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
              >
                Selanjutnya <ArrowRightIcon className="size-4" data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Writing Section */}
        {step === 3 && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <PenToolIcon className="size-5.5 text-violet-400" />
                <span>Bagian 2: Praktik Menulis (Writing)</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Tulis perkenalan singkat diri Anda dalam bahasa Inggris dan jelaskan mengapa Anda ingin belajar di platform ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {errorMessage && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 mb-2 leading-relaxed">
                <div className="font-bold text-violet-400 mb-0.5">Petunjuk:</div>
                <p>Tulis minimal 2-3 kalimat lengkap (contoh: *"My name is Malik. I want to learn English so that I can apply for a scholarship..."*).</p>
              </div>

              <div className="space-y-1">
                <Textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Type your response in English here..."
                  className="min-h-40 border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-700 text-sm leading-relaxed"
                  required
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1">
                  <span>Jumlah kata: <span className={wordCount < 10 ? "text-amber-500" : "text-emerald-400"}>{wordCount} kata</span></span>
                  <span>Karakter: {essay.length}</span>
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between gap-4 border-t border-slate-900/50 pt-4">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400 hover:text-white">
                <ArrowLeftIcon className="size-4" data-icon="inline-start" /> Kembali
              </Button>
              <Button 
                onClick={handleOnboardingSubmit} 
                disabled={wordCount < 5}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500 px-6"
              >
                Kirim & Selesaikan Pre-Test
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Submission Loading Screen */}
        {step === 4 && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl py-12 text-center">
            <CardContent className="space-y-4 flex flex-col items-center">
              <div className="size-16 rounded-full border-4 border-t-violet-500 border-slate-950 animate-spin mb-4" />
              <CardTitle className="text-2xl font-black text-white">Menganalisis Kemampuan Anda...</CardTitle>
              <p className="text-sm text-slate-400 max-w-sm">
                Harap tunggu sebentar. Tutor AI sedang mengoreksi struktur kalimat Anda dan menaksir baseline IELTS & TOEFL Anda.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Level Results */}
        {step === 5 && results && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 blur-3xl rounded-full" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-800/40 text-emerald-400 p-3 rounded-2xl size-12 flex items-center justify-center mb-3">
                <CheckCircle2Icon className="size-6" />
              </div>
              <CardTitle className="text-2xl font-black text-white">Pre-Test Selesai!</CardTitle>
              <p className="text-xs text-slate-400">Baseline level penaksiran awal Anda</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              {/* Level Assessment Badge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rekomendasi Kategori Level Anda</div>
                <div className="text-3xl font-black text-white bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent capitalize">
                  {results.level}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Materi pelajaran, tips ujian, serta artikel membaca di dashboard Anda akan disesuaikan untuk kategori **{results.level}**.
                </p>
              </div>

              {/* Standardized baseline scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-center">
                  <div className="text-[10px] uppercase text-violet-400 font-bold">Baseline IELTS</div>
                  <div className="text-2xl font-black text-white mt-1">{results.ieltsBand.toFixed(1)}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-center">
                  <div className="text-[10px] uppercase text-emerald-400 font-bold">Baseline TOEFL</div>
                  <div className="text-2xl font-black text-white mt-1">{results.toeflScore}</div>
                </div>
              </div>


            </CardContent>
            <CardFooter className="border-t border-slate-900/50 py-4">
              <Button 
                onClick={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500"
              >
                Mulai Belajar (Buka Dashboard) <ArrowRightIcon className="size-4" data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  );
}
