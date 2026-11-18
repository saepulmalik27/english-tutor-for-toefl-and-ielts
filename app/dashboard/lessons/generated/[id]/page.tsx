import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, GraduationCapIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LessonDetailsProps {
  params: Promise<{ id: string }>;
}

export default async function GeneratedLessonDetailsPage({ params }: LessonDetailsProps) {
  const { id } = await params;
  const lesson = await db.generatedLesson.findUnique({
    where: { id },
  });

  if (!lesson) {
    redirect("/dashboard");
  }

  const parseInlineMarkdown = (text: string) => {
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = text.split(regex);
    
    return tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={i} className="text-white font-bold">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith("*") && token.endsWith("*")) {
        return <em key={i} className="text-slate-100 italic">{token.slice(1, -1)}</em>;
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return <code key={i} className="bg-slate-950 border border-slate-800 text-violet-400 text-xs px-1.5 py-0.5 rounded font-mono font-medium">{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  const renderContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl font-bold text-slate-100 mt-6 mb-2">
            {parseInlineMarkdown(trimmed.replace("### ", ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("#### ")) {
        return (
          <h4 key={index} className="text-lg font-bold text-violet-300 mt-4 mb-2">
            {parseInlineMarkdown(trimmed.replace("#### ", ""))}
          </h4>
        );
      }
      if (trimmed.startsWith("⚠️ ")) {
        return (
          <div key={index} className="border-l-4 border-amber-500 bg-amber-950/20 p-4 rounded-r-lg text-slate-300 my-4 text-sm">
            {parseInlineMarkdown(trimmed)}
          </div>
        );
      }
      if (trimmed.startsWith("*")) {
        const isNested = line.startsWith("    *") || line.startsWith("  *");
        const cleanText = trimmed.replace(/^\*\s+/, "");
        return (
          <ul key={index} className={`list-disc text-slate-300 space-y-1 my-1.5 ${isNested ? "pl-8 text-xs text-slate-400" : "pl-5 text-sm"}`}>
            <li>{parseInlineMarkdown(cleanText)}</li>
          </ul>
        );
      }
      if (trimmed.startsWith("❌") || trimmed.startsWith("✔️")) {
        return (
          <div key={index} className="bg-slate-950 border border-slate-900 rounded px-3 py-1.5 font-mono text-xs my-1">
            <span className={trimmed.includes("❌") ? "text-red-400" : "text-emerald-400"}>
              {parseInlineMarkdown(trimmed)}
            </span>
          </div>
        );
      }
      if (trimmed === "") {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-slate-300 text-sm leading-relaxed mb-2">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-semibold group"
      >
        <ArrowLeftIcon className="size-3.5 group-hover:-translate-x-0.5 transition-all" />
        <span>Kembali ke Dashboard</span>
      </Link>

      <Card className="border-slate-800 bg-slate-900/30">
        <CardHeader className="border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-slate-950 text-violet-400 border-slate-800">
                {lesson.category}
              </Badge>
              <Badge variant="outline" className="text-violet-400 border-violet-900/50 bg-violet-955 bg-violet-950/20 font-bold flex items-center gap-1">
                <SparklesIcon className="size-3" />
                <span>Personalized Lesson</span>
              </Badge>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <GraduationCapIcon className="size-7 text-violet-400" />
              <span>{lesson.title}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="max-w-none text-slate-300">
            {renderContent(lesson.content)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
