import Link from "next/link";
import { signInAction } from "@/app/actions/authActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SparklesIcon } from "lucide-react";

interface LoginProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginProps) {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      {/* Visual background accents */}
      <div className="absolute top-1/4 left-1/4 -z-10 size-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 size-96 rounded-full bg-emerald-600/10 blur-3xl" />

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 shadow-lg shadow-violet-500/20">
            <SparklesIcon className="size-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
            EnglishTutor
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Personalisasi belajar dengan metode 10-20-70
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Selamat Datang Kembali</CardTitle>
            <CardDescription className="text-slate-400">
              Masuk ke akun Anda untuk melanjutkan belajar.
            </CardDescription>
          </CardHeader>
          <form action={signInAction}>
            <CardContent className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                  ⚠️ {error}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="emailOrUsername">
                  Email atau Username
                </label>
                <Input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  placeholder="name@example.com atau username"
                  required
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="password">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="size-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs font-medium text-slate-400 select-none cursor-pointer hover:text-slate-300">
                  Ingat Saya (30 Hari)
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500">
                Masuk
              </Button>
              <div className="text-center text-sm text-slate-400">
                Belum punya akun?{" "}
                <Link href="/signup" className="font-semibold text-violet-400 hover:text-violet-300 hover:underline">
                  Daftar di sini
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
