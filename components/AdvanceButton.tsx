"use client";
// Finishes the current Practice Session block and shows the next one.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { advanceSessionAction } from "@/app/actions/sessionActions";

export default function AdvanceButton({ step, label = "Lanjut" }: { step: number; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button className="mt-3 w-full" size="lg" disabled={busy}
      onClick={async () => { setBusy(true); await advanceSessionAction(step); router.refresh(); }}>
      {label}
    </Button>
  );
}
