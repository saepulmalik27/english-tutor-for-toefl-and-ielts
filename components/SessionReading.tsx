"use client";
// Reading block of the Practice Session: read the passage first, then answer one question per screen;
// on a phone the passage stays one tap away in a scrollable dialog instead of a long scroll back up.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PassageReader, { type PassageView } from "@/components/PassageReader";
import QuestionFlow, { type FlowQuestion } from "@/components/QuestionFlow";
import AdvanceButton from "@/components/AdvanceButton";

export default function SessionReading({ passage, questions, step }: { passage: PassageView; questions: FlowQuestion[]; step: number }) {
  const [answering, setAnswering] = useState(false);
  if (!answering) {
    return (
      <div className="space-y-4">
        <PassageReader passage={passage} />
        <Button className="w-full" size="lg" onClick={() => setAnswering(true)}>Mulai menjawab ({questions.length} soal)</Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>Lihat teks</DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle className="sr-only">{passage.title}</DialogTitle>
          <PassageReader passage={passage} />
        </DialogContent>
      </Dialog>
      <QuestionFlow questions={questions} endAction={<AdvanceButton step={step} />} />
    </div>
  );
}
