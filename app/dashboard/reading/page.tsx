import { getArticlesAction } from "@/app/actions/progressActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, CheckCircle2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ReadingPage() {
  const articles = await getArticlesAction();

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "basic": return "text-emerald-400 border-emerald-950 bg-emerald-950/20";
      case "intermediate": return "text-indigo-400 border-indigo-950 bg-indigo-950/20";
      case "advanced": return "text-violet-400 border-violet-950 bg-violet-950/20";
      default: return "text-slate-400 border-slate-900 bg-slate-900/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <BookOpenIcon className="size-8 text-emerald-400" />
          <span>70% Latihan Membaca (Reading Hub)</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Tingkatkan kemampuan membaca dan kosakata Anda. Baca artikel di bawah ini, **klik kosakata apa saja untuk melihat terjemahannya**, lalu jawab kuis untuk menaksir skor TOEFL/IELTS Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {articles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Belum ada artikel yang tersedia saat ini.
          </div>
        ) : (
          articles.map((art) => (
            <Card key={art.id} className="border-slate-800 bg-slate-900/30 flex flex-col justify-between hover:border-slate-700 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <Badge variant="outline" className={getDifficultyColor(art.difficulty)}>
                    {art.difficulty}
                  </Badge>
                  {art.completed && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle2Icon className="size-3.5 fill-emerald-500/10" />
                      <span>Selesai ({art.score}%)</span>
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg font-bold text-white leading-tight">
                  {art.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <CardDescription className="text-slate-400 text-sm">
                  {art.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-0 border-t border-slate-900/50 py-3 px-6 bg-slate-950/20">
                <Link 
                  href={`/dashboard/reading/${art.id}`} 
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 ml-auto group"
                >
                  Mulai Baca <ArrowRightIcon className="size-3.5 group-hover:translate-x-1 transition-all" />
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
