import { getArticleDetailsAction } from "@/app/actions/progressActions";
import InteractiveArticle from "@/components/InteractiveArticle";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

interface ArticleDetailsProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailsPage({ params }: ArticleDetailsProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const article = await getArticleDetailsAction(id);

  if (!article) {
    redirect("/dashboard/reading");
  }

  return (
    <div className="space-y-6">
      <Link 
        href="/dashboard/reading" 
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-semibold group"
      >
        <ArrowLeftIcon className="size-3.5 group-hover:-translate-x-0.5 transition-all" />
        <span>Kembali ke Daftar Artikel</span>
      </Link>

      <InteractiveArticle 
        article={{
          id: article.id,
          title: article.title,
          content: article.content,
          translation: article.translation,
          vocabJson: article.vocabJson,
          difficulty: article.difficulty,
        }}
        questions={article.questions.map(q => ({
          id: q.id,
          question: q.question,
          optionsJson: q.optionsJson,
          answer: q.answer,
          explanation: q.explanation,
        }))}
      />
    </div>
  );
}
