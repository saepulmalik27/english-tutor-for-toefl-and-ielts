"use client";

import { useState } from "react";
import { submitQuizAction } from "@/app/actions/progressActions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Volume2Icon, 
  HelpCircleIcon, 
  CheckCircle2Icon, 
  BookOpenIcon, 
  SparklesIcon, 
  BookmarkIcon 
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  optionsJson: string; // JSON string array of options
  answer: string;
  explanation: string;
}

interface InteractiveArticleProps {
  article: {
    id: string;
    title: string;
    content: string;
    translation: string;
    vocabJson: string; // JSON string dictionary
    difficulty: string;
  };
  questions: Question[];
}

export default function InteractiveArticle({ article, questions }: InteractiveArticleProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    ieltsBand: number;
    toeflScore: number;
    xpGained: number;
  } | null>(null);

  const vocabDict: Record<string, string> = JSON.parse(article.vocabJson || "{}");

  // Handle clicking on an English word
  const handleWordClick = (word: string) => {
    // Sanitize word (remove punctuation)
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim().toLowerCase();
    if (!cleanWord) return;

    setSelectedWord(word);
    
    // Look up in dictionary
    const foundTranslation = vocabDict[cleanWord] || vocabDict[word.toLowerCase()];
    if (foundTranslation) {
      setTranslation(foundTranslation);
    } else {
      // Fallback message
      setTranslation("Kosakata umum (Buka kamus mandiri untuk melihat arti lengkap)");
    }
    setShowLookupModal(true);
  };

  // Text-To-Speech pronunciation audio
  const handleSpeak = () => {
    if (!selectedWord) return;
    const cleanWord = selectedWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Handle selecting quiz option
  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  // Submit quiz answers
  const handleQuizSubmit = async () => {
    // Verify all questions are answered
    if (Object.keys(answers).length < questions.length) {
      alert("Harap jawab semua pertanyaan kuis terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitQuizAction(article.id, answers);
      if (response.success) {
        setQuizResult({
          score: response.score,
          correctAnswers: response.correctAnswers,
          totalQuestions: response.totalQuestions,
          ieltsBand: response.ieltsBand,
          toeflScore: response.toeflScore,
          xpGained: response.xpGained
        });
      } else {
        alert(response.error || "Gagal memproses kuis.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render clickable text words
  const renderClickableText = (text: string) => {
    const paragraphs = text.split("\n\n");
    return paragraphs.map((para, pIdx) => {
      const words = para.split(" ");
      return (
        <p key={pIdx} className="text-slate-300 text-base leading-relaxed mb-6 font-medium">
          {words.map((word, wIdx) => (
            <span key={wIdx}>
              <span 
                onClick={() => handleWordClick(word)}
                className="cursor-pointer border-b border-dashed border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 rounded px-0.5 transition-all duration-150"
              >
                {word}
              </span>
              {" "}
            </span>
          ))}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Word translation pop-up dialog */}
      <Dialog open={showLookupModal} onOpenChange={setShowLookupModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span className="capitalize text-emerald-400">{selectedWord?.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")}</span>
              <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={handleSpeak}>
                <Volume2Icon className="size-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Pengucapan kata: Klik ikon audio untuk mendengar pelafalan dalam bahasa Inggris.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 border-t border-slate-800">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Arti Terjemahan (Bahasa Indonesia)</div>
            <div className="text-base text-slate-200 font-medium bg-slate-950 p-3 rounded-lg border border-slate-800">
              {translation}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-900 pb-4">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpenIcon className="size-6 text-emerald-400" />
              <span>{article.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {renderClickableText(article.content)}
            </div>
            
            {/* Indonesian Translation Helper Accordion */}
            <div className="mt-8 border-t border-slate-900 pt-6">
              <details className="group">
                <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-white flex items-center justify-between select-none">
                  <span>Bantuan Terjemahan Paragraf (Bahasa Indonesia)</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-sm text-slate-400 leading-relaxed">
                  {article.translation}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>

        {/* Action button to show/hide quiz */}
        {!showQuiz && (
          <Button 
            onClick={() => setShowQuiz(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-500 hover:to-teal-500 py-6 text-sm"
          >
            <HelpCircleIcon data-icon="inline-start" />
            Buka Kuis Pemahaman Membaca
          </Button>
        )}
      </div>

      {/* Sidebar: Quiz and Score estimation */}
      <div className="lg:col-span-1">
        {showQuiz && (
          <div className="space-y-6">
            
            {/* Quiz Result View */}
            {quizResult ? (
              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-2xl rounded-full" />
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 p-3 rounded-2xl size-12 flex items-center justify-center mb-3">
                    <CheckCircle2Icon className="size-6" />
                  </div>
                  <CardTitle className="text-2xl font-black text-white">Kuis Selesai!</CardTitle>
                  <p className="text-xs text-slate-400">Skor pemahaman dan estimasi metrik Anda</p>
                </CardHeader>
                <CardContent className="space-y-6 text-center pt-2">
                  
                  {/* Score details */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-xs uppercase text-slate-500 font-bold">Skor Jawaban Benar</div>
                    <div className="text-3xl font-black text-white">{quizResult.score}%</div>
                    <div className="text-xs text-slate-400">{quizResult.correctAnswers} dari {quizResult.totalQuestions} Soal Terjawab Benar</div>
                  </div>

                  {/* Estimated Standardized Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase text-violet-400 font-bold">Est. IELTS Reading</div>
                      <div className="text-xl font-black text-white mt-0.5">{quizResult.ieltsBand.toFixed(1)}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase text-emerald-400 font-bold">Est. TOEFL Reading</div>
                      <div className="text-xl font-black text-white mt-0.5">{quizResult.toeflScore}</div>
                    </div>
                  </div>

                  {/* XP Gained alert */}
                  <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-800/40 p-3 rounded-xl text-xs text-violet-300 font-semibold flex items-center justify-center gap-1.5">
                    <SparklesIcon className="size-4 animate-bounce" />
                    <span>Selamat! Anda mendapatkan +{quizResult.xpGained} XP!</span>
                  </div>

                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => {
                      setShowQuiz(false);
                      setQuizResult(null);
                      setAnswers({});
                    }}
                    variant="outline" 
                    className="w-full border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white"
                  >
                    Ulangi Kuis
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              
              /* Quiz Questionnaire View */
              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircleIcon className="size-5 text-emerald-400" />
                    <span>Kuis Pemahaman</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {questions.map((q, idx) => {
                    const options: string[] = JSON.parse(q.optionsJson || "[]");
                    return (
                      <div key={q.id} className="space-y-3 border-b border-slate-900 pb-5 last:border-0 last:pb-0">
                        <div className="text-sm font-semibold text-slate-200">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="flex flex-col gap-2">
                          {options.map((opt) => {
                            const isSelected = answers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleOptionSelect(q.id, opt)}
                                className={`text-left text-xs p-3 rounded-lg border transition-all ${
                                  isSelected 
                                    ? "bg-emerald-950/30 border-emerald-500 text-emerald-300 font-semibold" 
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button 
                    onClick={handleQuizSubmit}
                    disabled={isSubmitting || Object.keys(answers).length < questions.length}
                    className="w-full bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                  >
                    {isSubmitting ? "Memproses..." : "Kirim Jawaban"}
                  </Button>
                  <Button 
                    onClick={() => setShowQuiz(false)}
                    variant="ghost" 
                    className="w-full text-slate-400 hover:text-white"
                  >
                    Tutup Kuis
                  </Button>
                </CardFooter>
              </Card>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
