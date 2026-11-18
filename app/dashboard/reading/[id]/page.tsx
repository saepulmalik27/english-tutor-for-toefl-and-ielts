import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import PassageReader from "@/components/PassageReader";

export default async function PassagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const passage = await db.passage.findFirst({ where: { id, status: "active" } });
  if (!passage) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/reading" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeftIcon className="size-3.5" />
        <span>Kembali ke daftar passage</span>
      </Link>
      <PassageReader passage={passage} />
    </div>
  );
}
