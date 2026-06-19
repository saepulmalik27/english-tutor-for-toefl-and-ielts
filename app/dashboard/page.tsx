import { getUserStatsAction } from "@/app/actions/progressActions";
import DashboardCharts from "@/components/DashboardCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  GraduationCapIcon, 
  BookOpenIcon, 
  PenToolIcon, 
  TrendingUpIcon, 
  CalendarIcon, 
  SparklesIcon, 
  ArrowRightIcon 
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch personalized recommended lesson based on user IELTS band from pre-test
  const userLevel = user.currentIeltsBand >= 6.5 ? "Advanced" : user.currentIeltsBand >= 5.0 ? "Intermediate" : "Basic";
  const recommendedLesson = await db.lesson.findFirst({
    where: { difficulty: userLevel },
  }) || await db.lesson.findFirst();

  const stats = await getUserStatsAction();
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        Loading statistics...
      </div>
    );
  }

  // Calculate XP needed for next level (Level = XP / 100 + 1)
  const currentLevel = Math.floor(stats.xp / 100) + 1;
  const currentLevelXp = stats.xp % 100;
  const nextLevelXpNeeded = 100;
  const levelProgressPercentage = (currentLevelXp / nextLevelXpNeeded) * 100;

  // TOEFL / IELTS mappings for Indonesian equivalents
  const getIeltsDescriptor = (band: number) => {
    if (band >= 8.0) return "Expert User (C2)";
    if (band >= 7.0) return "Good User (C1)";
    if (band >= 6.0) return "Competent User (B2)";
    if (band >= 5.0) return "Modest User (B1)";
    return "Improvable User (A2/B1)";
  };

  const getToeflDescriptor = (score: number) => {
    if (score >= 95) return "Advanced (C1/C2)";
    if (score >= 72) return "High Intermediate (B2)";
    if (score >= 42) return "Low Intermediate (B1)";
    return "Basic (A2)";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-900 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full -z-10 bg-violet-600/5 blur-3xl rounded-full" />
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Halo, {user.username}! <SparklesIcon className="size-6 text-violet-400 fill-violet-400/20" />
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Mari tingkatkan skor IELTS dan TOEFL Anda melalui metode belajar praktis 10-20-70 hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-xl min-w-[200px]">
          <div className="size-10 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-400 font-bold text-sm">
            Lv {currentLevel}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Progress Level</span>
              <span>{currentLevelXp}/100 XP</span>
            </div>
            <Progress value={levelProgressPercentage} className="h-2 bg-slate-900 border border-slate-800" />
          </div>
        </div>
      </div>

      {/* Recommended Lesson Banner */}
      {recommendedLesson && (
        <Card className="border-violet-900/50 bg-violet-950/10 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6">
          <div className="absolute top-0 right-0 w-80 h-full -z-10 bg-violet-600/5 blur-3xl rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-900 text-violet-200 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                REKOMENDASI MATERI ({userLevel.toUpperCase()})
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">
              {recommendedLesson.title}
            </h3>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              {recommendedLesson.summary}
            </p>
          </div>
          <Link 
            href={`/dashboard/lessons/${recommendedLesson.id}`}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs text-center flex items-center justify-center gap-2 group transition-all shrink-0"
          >
            Pelajari Sekarang <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-all animate-pulse" />
          </Link>
        </Card>
      )}

      {/* Main TOEFL / IELTS Estimations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IELTS Card */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 -z-10 bg-violet-600/5 blur-2xl rounded-full group-hover:scale-125 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
              <span>Estimasi IELTS Band</span>
              <span className="text-xs font-semibold text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded-full">Standar Akademik</span>
            </CardTitle>
            <CardDescription className="text-slate-400">Diperbaharui berdasarkan latihan menulis & membaca harian Anda.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6 py-4">
            <div className="relative size-24 flex items-center justify-center rounded-full bg-slate-950 border-2 border-violet-500 shadow-lg shadow-violet-500/10">
              <span className="text-3xl font-black text-white">{stats.ieltsBand.toFixed(1)}</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Kategori Kecakapan</div>
              <div className="text-lg font-extrabold text-slate-100">{getIeltsDescriptor(stats.ieltsBand)}</div>
              <p className="text-xs text-slate-500">IELTS menilai kemampuan bahasa Inggris dari rentang band 1.0 sampai 9.0.</p>
            </div>
          </CardContent>
        </Card>

        {/* TOEFL Card */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 -z-10 bg-emerald-600/5 blur-2xl rounded-full group-hover:scale-125 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
              <span>Estimasi TOEFL iBT</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded-full">Standar Global</span>
            </CardTitle>
            <CardDescription className="text-slate-400">Diperbaharui berdasarkan ketepatan kuis pemahaman bacaan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6 py-4">
            <div className="relative size-24 flex items-center justify-center rounded-full bg-slate-950 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10">
              <span className="text-3xl font-black text-white">{stats.toeflScore}</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Kategori Kecakapan</div>
              <div className="text-lg font-extrabold text-slate-100">{getToeflDescriptor(stats.toeflScore)}</div>
              <p className="text-xs text-slate-500">TOEFL iBT menilai kemampuan akademik bahasa Inggris dari skor 0 sampai 120.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 10-20-70 concept cards and interactive dashboard charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Concept 10-20-70 overview HUD */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUpIcon className="size-5 text-indigo-400" />
              <span>Konsep 10:20:70</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Metode personalisasi pembelajaran bahasa Inggris yang terbukti efektif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 flex-1">
            
            {/* 10% Structured Learning info */}
            <div className="space-y-1 border-l-2 border-violet-500 pl-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-200">10% Materi Formal (Belajar Mandiri)</span>
                <span className="text-xs font-semibold text-violet-400">10% Fokus</span>
              </div>
              <p className="text-xs text-slate-400">Mempelajari teori dasar tenses, kosakata, tata bahasa, dan tips ujian terstruktur.</p>
              <div className="pt-1">
                <Link href="/dashboard/lessons" className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 group">
                  Buka Pelajaran <ArrowRightIcon className="size-3 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* 20% Feedback info */}
            <div className="space-y-1 border-l-2 border-pink-500 pl-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-200">20% Koreksi & Umpan Balik</span>
                <span className="text-xs font-semibold text-pink-400">20% Fokus</span>
              </div>
              <p className="text-xs text-slate-400">Mendapatkan umpan balik tata bahasa, ejaan, dan pilihan kata (dikoreksi oleh Tutor AI).</p>
              <div className="pt-1">
                <Link href="/dashboard/writing" className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 group">
                  Lihat Riwayat Feedback <ArrowRightIcon className="size-3 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* 70% Experiential Practice info */}
            <div className="space-y-1 border-l-2 border-emerald-500 pl-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-200">70% Praktik Mandiri (Menulis/Membaca)</span>
                <span className="text-xs font-semibold text-emerald-400">70% Fokus</span>
              </div>
              <p className="text-xs text-slate-400">Latihan intensif membaca artikel dengan klik terjemahan kosakata serta menulis jurnal harian.</p>
              <div className="pt-1">
                <Link href="/dashboard/reading" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 group">
                  Latihan Praktik Sekarang <ArrowRightIcon className="size-3 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Dynamic Charts component */}
        <DashboardCharts historyData={stats.history} />

      </div>

      {/* Bottom Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900/30">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-violet-600/10 rounded-xl text-violet-400">
              <CalendarIcon className="size-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.streak} Hari</div>
              <div className="text-xs text-slate-400">Streak Harian Aktif</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/30">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400">
              <BookOpenIcon className="size-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.completedReadings} Artikel</div>
              <div className="text-xs text-slate-400">Artikel Selesai Dibaca & Kuis</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/30">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-400">
              <PenToolIcon className="size-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.completedWritings} Jurnal</div>
              <div className="text-xs text-slate-400">Entri Menulis Dievaluasi AI</div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
