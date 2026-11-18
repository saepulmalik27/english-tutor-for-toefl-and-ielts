// PROTOTYPE (ticket 10): three variants of one 30-minute Practice Session on a phone,
// switchable via ?variant=A|B|C. Fake data, no DB, nothing saved. Throw away after the verdict.
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const variants = [
  { key: "A", name: "Langkah demi langkah" },
  { key: "B", name: "Mode ujian" },
  { key: "C", name: "Hub harian" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ variant?: string }> }) {
  const raw = ((await searchParams).variant ?? "A").toUpperCase();
  const v = variants.some(x => x.key === raw) ? raw : "A";
  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {v === "A" && <VariantA key="A" />}
      {v === "B" && <VariantB key="B" />}
      {v === "C" && <VariantC key="C" />}
      <PrototypeSwitcher variants={variants} current={v} />
    </main>
  );
}
