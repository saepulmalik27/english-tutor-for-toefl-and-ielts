import { getLessonsAction } from "@/app/actions/progressActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRightIcon, GraduationCapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function LessonsPage() {
  const lessons = await getLessonsAction();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <GraduationCapIcon className="size-8 text-violet-400" />
          <span>10% Materi Formal (Belajar Mandiri)</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Kunci sukses belajar bahasa Inggris adalah memahami pondasi dasarnya. Pelajari tata bahasa, kosakata akademik, dan tips sukses ujian terstruktur di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {lessons.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Belum ada pelajaran yang tersedia saat ini.
          </div>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id} className="border-slate-800 bg-slate-900/30 flex flex-col justify-between hover:border-slate-700 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-slate-950 text-violet-400 border-slate-800">
                    {lesson.category}
                  </Badge>
                  <Badge variant="outline" className="text-slate-400 border-slate-800">
                    {lesson.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-white leading-tight">
                  {lesson.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <CardDescription className="text-slate-400 text-sm">
                  {lesson.summary}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-0 border-t border-slate-900/50 py-3 px-6 bg-slate-950/20">
                <Link 
                  href={`/dashboard/lessons/${lesson.id}`} 
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1.5 ml-auto group"
                >
                  Mulai Belajar <ArrowRightIcon className="size-3.5 group-hover:translate-x-1 transition-all" />
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
