"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn, formatTime, bandScoreBg } from "@/lib/utils";
import { Headphones, Clock, CheckCircle, XCircle, ChevronRight, Plus, Lightbulb, Volume2 } from "lucide-react";

interface Question {
  id: number;
  passage: string | null;
  audioUrl: string | null;
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

const LISTENING_TIPS: Record<number, string[]> = {
  1: [
    "Part 1: Percakapan sehari-hari (telepon, booking, dll). Focus pada angka, nama, alamat.",
    "Prediksi jawaban sebelum audio diputar berdasarkan konteks soal.",
    "Perhatikan spelling — sering ada nama orang/tempat yang perlu ditulis.",
  ],
  2: [
    "Part 2: Monolog (pengumuman, tur, dll). Perhatikan perubahan topik.",
    "Untuk multiple choice, eliminasi opsi yang jelas salah dulu.",
    "Speaker sering memberikan informasi 'distractors' — jawaban pertama bisa berubah.",
  ],
  3: [
    "Part 3: Diskusi akademik (2-4 orang). Perhatikan siapa yang bicara apa.",
    "Sering ada soal tentang pendapat/sikap — dengarkan intonasi.",
    "Fokus pada kata-kata yang menunjukkan persetujuan/ketidaksetujuan.",
  ],
  4: [
    "Part 4: Kuliah/presentasi akademik. Paling sulit — kosakata akademik banyak.",
    "Ikuti alur logika pembicara — biasanya ada intro, main points, conclusion.",
    "Fill-in-the-blank: Jawaban biasanya terdengar jelas dan tepat di audio.",
  ],
};

const BAND_FROM_CORRECT: Record<number, number> = {
  40: 9.0, 39: 8.5, 37: 8.0, 35: 7.5, 33: 7.0, 30: 6.5,
  27: 6.0, 23: 5.5, 19: 5.0, 15: 4.5, 13: 4.0,
};

function estimateBand(correct: number, total: number): number {
  const scaled = Math.round((correct / total) * 40);
  const keys = Object.keys(BAND_FROM_CORRECT).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (scaled >= k) return BAND_FROM_CORRECT[k];
  }
  return 3.5;
}

export default function ListeningClient({ questions }: Props) {
  const [mode, setMode] = useState<"tip" | "practice" | "result">("tip");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [currentPart, setCurrentPart] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const finishSession = useCallback(async () => {
    setTimerActive(false);
    const correct = questions.filter(
      (q) => answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim()
    ).length;
    const band = estimateBand(correct, questions.length);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "listening", bandScore: band, score: correct }),
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

  const parts = [...new Set(questions.map((q) => q.partNumber || 1))].sort();

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-6 h-6 text-purple-600" /> Listening Practice
          </h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Belum ada soal Listening.</p>
          <button
            onClick={async () => { await fetch("/api/seed/listening", { method: "POST" }); window.location.reload(); }}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Load Contoh Soal
          </button>
        </div>
        <PartTips tips={LISTENING_TIPS} currentPart={currentPart} setCurrentPart={setCurrentPart} />
      </div>
    );
  }

  const current = questions[currentIdx];
  const options: string[] = current.options ? JSON.parse(current.options) : [];
  const userAnswer = answers[current.id];
  const isCorrect = userAnswer?.toLowerCase().trim() === current.answer.toLowerCase().trim();

  if (mode === "tip") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-6 h-6 text-purple-600" /> Listening Practice
          </h1>
          <p className="text-gray-500 text-sm mt-1">{questions.length} soal tersedia · Parts: {parts.join(", ")}</p>
        </div>
        <PartTips tips={LISTENING_TIPS} currentPart={currentPart} setCurrentPart={setCurrentPart} />
        <div className="mt-6">
          <button
            onClick={() => { setMode("practice"); setTimerActive(true); setCurrentIdx(0); setAnswers({}); setTimeLeft(30 * 60); }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
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
          <Headphones className="w-5 h-5 text-purple-600" /> Listening Results
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-600">{correct}</p>
            <p className="text-sm text-gray-500">Correct / {questions.length}</p>
          </div>
          <div className="text-center">
            <span className={cn("text-3xl font-bold px-4 py-2 rounded-lg", bandScoreBg(band))}>
              Band {band.toFixed(1)}
            </span>
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
                  <p className="text-gray-500 text-xs">Part {q.partNumber}</p>
                  <p className="text-gray-700">{i + 1}. {q.question}</p>
                  {!ok && <p className="text-red-600 text-xs mt-0.5">Kamu: {ua || "—"} | Benar: {q.answer}</p>}
                  {q.explanation && <p className="text-gray-500 text-xs mt-0.5 italic">{q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setMode("tip"); setAnswers({}); setTimeLeft(30 * 60); }} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700">
          Latihan Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Headphones className="w-5 h-5 text-purple-600" /> Listening Practice
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
            Part {current.partNumber || 1}
          </span>
          <span className="text-sm text-gray-500">{currentIdx + 1}/{questions.length}</span>
          <div className={cn("flex items-center gap-1 font-mono text-sm font-bold px-3 py-1 rounded-lg", timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
            <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {current.audioUrl && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Audio</span>
          </div>
          <audio ref={audioRef} controls src={current.audioUrl} className="w-full" />
        </div>
      )}

      {current.passage && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
          {current.passage}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0">{currentIdx + 1}</span>
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
                  userAnswer === opt ? "border-purple-500 bg-purple-50 text-purple-800" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))} disabled={currentIdx === 0} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50">
          Sebelumnya
        </button>
        {currentIdx < questions.length - 1 ? (
          <button onClick={() => setCurrentIdx((p) => p + 1)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-1">
            Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={finishSession} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            Selesai & Lihat Hasil
          </button>
        )}
      </div>
    </div>
  );
}

function PartTips({ tips, currentPart, setCurrentPart }: { tips: Record<number, string[]>; currentPart: number; setCurrentPart: (p: number) => void }) {
  const partTips = tips[currentPart] || [];
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-semibold text-purple-800">Listening Tips per Part</span>
      </div>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4].map((p) => (
          <button
            key={p}
            onClick={() => setCurrentPart(p)}
            className={cn("px-3 py-1 rounded-lg text-sm font-medium transition-colors", currentPart === p ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200")}
          >
            Part {p}
          </button>
        ))}
      </div>
      <ul className="space-y-1.5">
        {partTips.map((tip, i) => (
          <li key={i} className="text-sm text-purple-900 flex gap-2">
            <span className="shrink-0">•</span>{tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
