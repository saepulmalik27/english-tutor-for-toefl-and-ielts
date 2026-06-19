import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/authActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  SparklesIcon, 
  FlameIcon, 
  TrophyIcon, 
  BookOpenIcon, 
  PenToolIcon, 
  LayoutDashboardIcon, 
  GraduationCapIcon,
  LogOutIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-xl">
              <SparklesIcon className="size-5 text-white" />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              EnglishTutor
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <LayoutDashboardIcon className="size-4" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/dashboard/lessons" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <GraduationCapIcon className="size-4" />
              <span>10% Materi</span>
            </Link>
            <Link 
              href="/dashboard/reading" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <BookOpenIcon className="size-4" />
              <span>70% Membaca</span>
            </Link>
            <Link 
              href="/dashboard/writing" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <PenToolIcon className="size-4" />
              <span>70% Menulis</span>
            </Link>
          </nav>

          {/* User Status Bar */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1 bg-amber-950/30 border border-amber-900/50 px-2.5 py-1 rounded-full text-amber-400 text-xs font-semibold" title="Active Streak">
              <FlameIcon className="size-3.5 fill-amber-500 stroke-amber-500 animate-pulse" />
              <span>{user.streak} Hari</span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-full text-emerald-400 text-xs font-semibold" title="XP Points">
              <TrophyIcon className="size-3.5 text-emerald-400" />
              <span>{user.xp} XP</span>
            </div>

            {/* IELTS / TOEFL HUD Indicator */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
              <span className="font-semibold text-violet-400">IELTS: {user.currentIeltsBand.toFixed(1)}</span>
              <span className="text-slate-600">|</span>
              <span className="font-semibold text-emerald-400">TOEFL: {user.currentToeflScore}</span>
            </div>

            {/* Logout Action */}
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-900" title="Keluar">
                <LogOutIcon className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile navigation header */}
      <div className="md:hidden sticky top-16 z-40 bg-slate-950/95 border-b border-slate-900 flex justify-around py-2 px-1">
        <Link 
          href="/dashboard" 
          className="flex flex-col items-center gap-1 px-2 py-1 text-slate-400 hover:text-white text-[10px] font-medium"
        >
          <LayoutDashboardIcon className="size-4" />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/dashboard/lessons" 
          className="flex flex-col items-center gap-1 px-2 py-1 text-slate-400 hover:text-white text-[10px] font-medium"
        >
          <GraduationCapIcon className="size-4" />
          <span>Materi</span>
        </Link>
        <Link 
          href="/dashboard/reading" 
          className="flex flex-col items-center gap-1 px-2 py-1 text-slate-400 hover:text-white text-[10px] font-medium"
        >
          <BookOpenIcon className="size-4" />
          <span>Membaca</span>
        </Link>
        <Link 
          href="/dashboard/writing" 
          className="flex flex-col items-center gap-1 px-2 py-1 text-slate-400 hover:text-white text-[10px] font-medium"
        >
          <PenToolIcon className="size-4" />
          <span>Menulis</span>
        </Link>
      </div>

      {/* Main page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
