"use client";
// Floating variant switcher for throwaway UI prototypes. Hidden in production builds.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PrototypeSwitcher({ variants, current }: { variants: { key: string; name: string }[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const i = Math.max(0, variants.findIndex(v => v.key === current));
  const go = (d: number) => router.replace(`${pathname}?variant=${variants[(i + d + variants.length) % variants.length].key}`);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-yellow-300 px-4 py-2 text-sm font-semibold text-black shadow-2xl ring-2 ring-black">
      <button aria-label="Previous variant" onClick={() => go(-1)}>←</button>
      <span>{variants[i].key} ({variants[i].name})</span>
      <button aria-label="Next variant" onClick={() => go(1)}>→</button>
    </div>
  );
}
