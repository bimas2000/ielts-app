"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn, formatTime, bandScoreBg } from "@/lib/utils";
import { BookOpen, Clock, CheckCircle, XCircle, ChevronRight, Plus, Lightbulb, GraduationCap, ArrowRight } from "lucide-react";

interface Question {
  id: number;
  passage: string | null;
  question: string;
  options: string | null;
  answer: string;
  explanation: string | null;
  type: string;
  partNumber: number | null;
  difficulty: string;
}

interface Props {
  questions: Question[];
}

const READING_TIPS = [
  "Skim the passage first (2-3 min) before reading questions — dapatkan gambaran umum.",
  "Baca pertanyaan sebelum membaca passage secara detail untuk tahu apa yang dicari.",
  "True/False/Not Given: 'Not Given' berarti informasinya tidak ada di passage, bukan berarti salah.",
  "Untuk Matching Headings, baca kalimat pertama dan terakhir tiap paragraf.",
  "Keywords di soal sering paraphrase di passage — cari sinonim, bukan kata yang sama persis.",
  "Jawab semua pertanyaan — tidak ada pengurangan nilai untuk jawaban salah.",
  "Perhatikan kata limit: 'NO MORE THAN TWO WORDS' artinya maksimal 2 kata.",
];

const BAND_SCORES: Record<number, number> = {
  40: 9.0, 39: 8.5, 37: 8.0, 35: 7.5, 33: 7.0, 30: 6.5,
  27: 6.0, 23: 5.5, 19: 5.0, 15: 4.5, 13: 4.0,
};

function estimateBand(correct: number, total: number): number {
  const score = Math.round((correct / total) * 40);
  const keys = Object.keys(BAND_SCORES).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (score >= k) return BAND_SCORES[k];
  }
  return 3.5;
}

export default function ReadingClient({ questions }: Props) {
  const searchParams = useSearchParams();
  const initMode = searchParams.get("mode") === "review" ? "review" : "start";
  const [mode, setMode] = useState<"start" | "tip" | "practice" | "result" | "review">(initMode);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 min
  const [timerActive, setTimerActive] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  const finishSession = useCallback(async () => {
    setTimerActive(false);
    const correct = questions.filter(
      (q) => answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim()
    ).length;
    const band = estimateBand(correct, questions.length);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "reading", bandScore: band, score: correct }),
    });
    setMode("result");
  }, [answers, questions]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(t); finishSession(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft, finishSession]);

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Reading Practice
          </h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Belum ada soal Reading.</p>
          <p className="text-sm text-gray-400">Import soal dari ieltsonlinetests.com atau gunakan tombol di bawah untuk menambah soal contoh.</p>
          <button
            onClick={async () => {
              await fetch("/api/seed/reading", { method: "POST" });
              window.location.reload();
            }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Load Contoh Soal IELTS
          </button>
        </div>
        <TipsPanel tips={READING_TIPS} />
      </div>
    );
  }

  const current = questions[currentIdx];
  const options: string[] = current.options ? JSON.parse(current.options) : [];
  const userAnswer = answers[current.id];
  const isCorrect = userAnswer?.toLowerCase().trim() === current.answer.toLowerCase().trim();

  if (mode === "review") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Pembahasan Reading
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review semua soal beserta jawaban dan penjelasan</p>
        </div>
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => {
            const opts: string[] = q.options ? JSON.parse(q.options) : [];
            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {q.passage && (
                  <div className="bg-blue-50 border-b border-blue-100 p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-blue-600 mb-2">Passage {q.partNumber}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{q.passage}</p>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0 h-fit">{i + 1}</span>
                    <p className="text-gray-800 font-medium text-sm">{q.question}</p>
                  </div>
                  {opts.length > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      {opts.map((opt, j) => (
                        <div key={j} className={cn(
                          "px-3 py-2 rounded-lg text-sm border",
                          opt === q.answer ? "bg-green-50 border-green-300 text-green-800 font-medium" : "bg-gray-50 border-gray-200 text-gray-600"
                        )}>
                          {opt === q.answer && "✓ "}{opt}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-3 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800 font-medium">
                      ✓ Jawaban: <strong>{q.answer}</strong>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setMode("practice"); setTimerActive(true); setCurrentIdx(0); setAnswers({}); setTimeLeft(60 * 60); }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Mulai Test
          </button>
          <Link href="/learn/reading" className="flex items-center gap-2 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <GraduationCap className="w-4 h-4" /> Belajar Lagi
          </Link>
        </div>
      </div>
    );
  }

  if (mode === "start") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Reading Practice
          </h1>
          <p className="text-gray-500 text-sm mt-1">{questions.length} soal tersedia</p>
        </div>

        {/* 3-step flow card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <p className="text-sm font-bold text-gray-700 mb-4">Alur Belajar yang Disarankan:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/learn/reading" className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
              <GraduationCap className="w-4 h-4" />
              <div>
                <p className="font-semibold">1. Belajar</p>
                <p className="text-xs opacity-70">~20 menit</p>
              </div>
            </Link>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <button onClick={() => { setMode("practice"); setTimerActive(true); setCurrentIdx(0); setAnswers({}); setTimeLeft(60 * 60); }}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
              <BookOpen className="w-4 h-4" />
              <div>
                <p className="font-semibold">2. Practice Test</p>
                <p className="text-xs opacity-70">60 menit</p>
              </div>
            </button>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <button onClick={() => setMode("review")}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
              <Lightbulb className="w-4 h-4" />
              <div>
                <p className="font-semibold">3. Pembahasan</p>
                <p className="text-xs opacity-70">Review jawaban</p>
              </div>
            </button>
          </div>
        </div>

        <TipsPanel tips={READING_TIPS} tipIdx={tipIdx} setTipIdx={setTipIdx} />
      </div>
    );
  }

  if (mode === "tip") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Reading Practice
          </h1>
          <p className="text-gray-500 text-sm mt-1">{questions.length} soal tersedia</p>
        </div>
        <TipsPanel tips={READING_TIPS} tipIdx={tipIdx} setTipIdx={setTipIdx} />
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => { setMode("practice"); setTimerActive(true); setCurrentIdx(0); setAnswers({}); setTimeLeft(60 * 60); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            Mulai Practice <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (mode === "result") {
    const correct = questions.filter(
      (q) => answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim()
    ).length;
    const band = estimateBand(correct, questions.length);
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" /> Reading Results
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600">{correct}</p>
              <p className="text-sm text-gray-500">Correct / {questions.length}</p>
            </div>
            <div className="text-center">
              <span className={cn("text-3xl font-bold px-4 py-2 rounded-lg", bandScoreBg(band))}>
                Band {band.toFixed(1)}
              </span>
              <p className="text-xs text-gray-500 mt-1">Estimated</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {questions.map((q, i) => {
            const ua = answers[q.id];
            const ok = ua?.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <div key={q.id} className={cn("bg-white rounded-lg border p-3 flex items-start gap-2", ok ? "border-green-200" : "border-red-200")}>
                {ok ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                <div className="text-sm">
                  <p className="text-gray-700">{i + 1}. {q.question}</p>
                  {!ok && <p className="text-red-600 text-xs mt-0.5">Jawaban kamu: {ua || "—"} | Benar: {q.answer}</p>}
                  {q.explanation && <p className="text-gray-500 text-xs mt-0.5 italic">{q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setMode("review")} className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Lihat Pembahasan
          </button>
          <button onClick={() => { setMode("start"); setAnswers({}); setTimeLeft(60 * 60); }} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50">
            Latihan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" /> Reading Practice
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{currentIdx + 1} / {questions.length}</span>
          <div className={cn("flex items-center gap-1 font-mono text-sm font-bold px-3 py-1 rounded-lg", timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {current.passage && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{current.passage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0">{currentIdx + 1}</span>
          <p className="text-gray-800 font-medium">{current.question}</p>
        </div>

        {options.length > 0 ? (
          <div className="space-y-2">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers((p) => ({ ...p, [current.id]: opt }))}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors",
                  userAnswer === opt
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            placeholder="Type your answer..."
            value={userAnswer || ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [current.id]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {userAnswer && (
          <div className="mt-3">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Lightbulb className="w-3 h-3" /> {showExplanation ? "Hide" : "Check Answer"}
            </button>
            {showExplanation && (
              <div className={cn("mt-2 p-3 rounded-lg text-sm", isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                {isCorrect ? "Benar!" : `Salah. Jawaban benar: ${current.answer}`}
                {current.explanation && <p className="text-gray-600 mt-1">{current.explanation}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => { setCurrentIdx((p) => Math.max(0, p - 1)); setShowExplanation(false); }}
          disabled={currentIdx === 0}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
        >
          Sebelumnya
        </button>
        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => { setCurrentIdx((p) => p + 1); setShowExplanation(false); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
          >
            Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finishSession}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Selesai & Lihat Hasil
          </button>
        )}
      </div>
    </div>
  );
}

function TipsPanel({ tips, tipIdx, setTipIdx }: { tips: string[]; tipIdx?: number; setTipIdx?: (i: number) => void }) {
  const idx = tipIdx ?? 0;
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-semibold text-yellow-800">Reading Tips</span>
      </div>
      <p className="text-sm text-yellow-900 mb-3">{tips[idx]}</p>
      <div className="flex gap-2 flex-wrap">
        {tips.map((_, i) => (
          <button
            key={i}
            onClick={() => setTipIdx?.(i)}
            className={cn(
              "w-6 h-6 rounded-full text-xs font-bold transition-colors",
              i === idx ? "bg-yellow-600 text-white" : "bg-yellow-200 text-yellow-700 hover:bg-yellow-300"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
