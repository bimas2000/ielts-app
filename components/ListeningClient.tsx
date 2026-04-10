"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn, formatTime, bandScoreBg } from "@/lib/utils";
import {
  Headphones, Clock, CheckCircle, XCircle, ChevronRight,
  Plus, Lightbulb, Play, Pause, RotateCcw, Volume2, VolumeX,
  Eye, EyeOff
} from "lucide-react";

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

interface Props { questions: Question[] }

const BAND_FROM_CORRECT: Record<number, number> = {
  40: 9.0, 39: 8.5, 37: 8.0, 35: 7.5, 33: 7.0, 30: 6.5,
  27: 6.0, 23: 5.5, 19: 5.0, 15: 4.5, 13: 4.0,
};

function estimateBand(correct: number, total: number): number {
  const scaled = Math.round((correct / total) * 40);
  const keys = Object.keys(BAND_FROM_CORRECT).map(Number).sort((a, b) => b - a);
  for (const k of keys) if (scaled >= k) return BAND_FROM_CORRECT[k];
  return 3.5;
}

// ── TTS Audio Player ──────────────────────────────────────────────────────────
function AudioPlayer({ text, partLabel }: { text: string; partLabel: string }) {
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [supported, setSupported] = useState(true);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) setSupported(false);
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  // Stop when text changes (new question)
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }, [text]);

  function play() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 1;
    utt.lang = "en-GB";
    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en"));
    if (enVoice) utt.voice = enVoice;
    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setPlaying(true);
  }

  function pause() {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPlaying(false);
    }
  }

  function resume() {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
    } else play();
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  if (!supported) return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700">
      Browser ini tidak support Text-to-Speech. Aktifkan Chrome untuk audio.
    </div>
  );

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">🎧 Audio — {partLabel}</span>
        </div>
        <button onClick={() => setShowScript(s => !s)} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
          {showScript ? <><EyeOff className="w-3 h-3" /> Sembunyikan Teks</> : <><Eye className="w-3 h-3" /> Lihat Teks</>}
        </button>
      </div>

      {/* Player controls */}
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-purple-100">
        {/* Sound wave animation when playing */}
        <div className="flex items-center gap-0.5 w-8">
          {[1,2,3,4].map(i => (
            <div key={i} className={cn(
              "w-1 rounded-full bg-purple-400 transition-all",
              playing ? "animate-pulse" : "opacity-30"
            )} style={{ height: playing ? `${8 + (i % 3) * 6}px` : "4px", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        <div className="flex-1 text-xs text-gray-500">
          {playing ? "Memutar audio..." : "Tekan ▶ untuk putar audio"}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={stop} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" title="Stop">
            <VolumeX className="w-4 h-4" />
          </button>
          <button onClick={() => { stop(); setTimeout(play, 100); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100" title="Ulang">
            <RotateCcw className="w-4 h-4" />
          </button>
          {playing ? (
            <button onClick={pause} className="w-9 h-9 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700">
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={resume} className="w-9 h-9 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700">
              <Play className="w-4 h-4 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-purple-500 mt-2">
        💡 Dalam IELTS nyata, audio hanya diputar sekali. Latih dirimu untuk tidak pause!
      </p>

      {/* Collapsible script */}
      {showScript && (
        <div className="mt-3 bg-white border border-purple-100 rounded-lg p-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-purple-600 mb-1">Audio Script:</p>
          <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}

// ── Part Tips ─────────────────────────────────────────────────────────────────
const LISTENING_TIPS: Record<number, string[]> = {
  1: ["Part 1: Percakapan sehari-hari. Focus pada angka, nama, waktu, dan alamat.", "Prediksi tipe jawaban sebelum audio: nama? angka? tempat?", "Perhatikan spelling — nama sering dieja huruf per huruf dalam audio."],
  2: ["Part 2: Monolog situasi sosial. Perhatikan perubahan topik.", "Untuk MCQ, eliminasi opsi yang jelas salah dulu sebelum audio.", "Pembicara bisa mengkoreksi diri — tulis jawaban TERAKHIR yang disebutkan."],
  3: ["Part 3: Diskusi akademik. Perhatikan siapa yang bicara apa.", "Perhatikan discourse markers: 'However', 'Actually', 'I disagree'.", "Sering ada soal tentang pendapat/sikap — dengarkan intonasi."],
  4: ["Part 4: Kuliah akademik — paling sulit. Fokus pada main points.", "Ikuti alur logika: intro → main points → examples → conclusion.", "Fill-blank: jawaban biasanya diucapkan jelas dan sedikit diperlambat."],
};

export default function ListeningClient({ questions }: Props) {
  const [mode, setMode] = useState<"start" | "practice" | "result">("start");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

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
      setTimeLeft((p) => { if (p <= 1) { clearInterval(t); finishSession(); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft, finishSession]);

  if (questions.length === 0) return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><Headphones className="w-6 h-6 text-purple-600" /> Listening Practice</h1>
      <div className="bg-white rounded-xl border p-8 text-center">
        <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">Belum ada soal Listening.</p>
        <button onClick={async () => { await fetch("/api/seed/listening", { method: "POST" }); window.location.reload(); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2 mx-auto">
          <Plus className="w-4 h-4" /> Load Soal
        </button>
      </div>
    </div>
  );

  const current = questions[currentIdx];
  const options: string[] = current.options ? JSON.parse(current.options) : [];
  const userAnswer = answers[current.id];

  // Group questions by part for audio
  const partPassages: Record<number, string> = {};
  questions.forEach(q => {
    const p = q.partNumber || 1;
    if (!partPassages[p] && q.passage) partPassages[p] = q.passage;
  });
  const currentPartPassage = partPassages[current.partNumber || 1] || current.passage || "";
  const partTips = LISTENING_TIPS[current.partNumber || 1] || [];

  // ── START screen ────────────────────────────────────────────────────────────
  if (mode === "start") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Headphones className="w-6 h-6 text-purple-600" /> Listening Practice</h1>
        <p className="text-gray-500 text-sm mb-6">{questions.length} soal · 4 parts · 30 menit</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Cara pakai Listening Practice ini</span>
          </div>
          <ul className="space-y-1 text-sm text-amber-900">
            <li>• Klik <strong>▶ Play Audio</strong> untuk mendengarkan teks yang dibacakan (TTS)</li>
            <li>• Jawab soal sambil mendengarkan — seperti IELTS asli</li>
            <li>• Sembunyikan teks script untuk latihan murni, atau buka untuk belajar</li>
            <li>• Timer 30 menit dimulai saat kamu klik Mulai</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(p => (
            <div key={p} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs font-bold text-purple-600 mb-1">Part {p}</p>
              <p className="text-xs text-gray-500">{LISTENING_TIPS[p][0].substring(0, 50)}...</p>
            </div>
          ))}
        </div>

        <button onClick={() => { setMode("practice"); setTimerActive(true); setCurrentIdx(0); setAnswers({}); setTimeLeft(30 * 60); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 flex items-center gap-2">
          <Play className="w-4 h-4" /> Mulai Practice
        </button>
      </div>
    );
  }

  // ── RESULT screen ───────────────────────────────────────────────────────────
  if (mode === "result") {
    const correct = questions.filter(q => answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim()).length;
    const band = estimateBand(correct, questions.length);
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Headphones className="w-5 h-5 text-purple-600" /> Listening Results</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 flex items-center gap-6">
          <div className="text-center"><p className="text-5xl font-bold text-purple-600">{correct}</p><p className="text-sm text-gray-500">Benar / {questions.length}</p></div>
          <div className="text-center"><span className={cn("text-3xl font-bold px-4 py-2 rounded-lg", bandScoreBg(band))}>Band {band.toFixed(1)}</span></div>
        </div>
        <div className="space-y-2 mb-4">
          {questions.map((q, i) => {
            const ua = answers[q.id];
            const ok = ua?.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <div key={q.id} className={cn("bg-white rounded-lg border p-3 flex items-start gap-2", ok ? "border-green-200" : "border-red-200")}>
                {ok ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                <div className="text-sm">
                  <p className="text-xs text-gray-400 mb-0.5">Part {q.partNumber}</p>
                  <p className="text-gray-700">{i + 1}. {q.question}</p>
                  {!ok && <p className="text-red-600 text-xs mt-0.5">Jawaban kamu: <strong>{ua || "—"}</strong> | Benar: <strong>{q.answer}</strong></p>}
                  {q.explanation && <p className="text-gray-500 text-xs mt-1 italic flex gap-1"><Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-yellow-500" />{q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setMode("start"); setAnswers({}); setTimeLeft(30 * 60); }} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700">
          Latihan Lagi
        </button>
      </div>
    );
  }

  // ── PRACTICE screen ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><Headphones className="w-5 h-5 text-purple-600" /> Listening Practice</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Part {current.partNumber || 1}</span>
          <span className="text-sm text-gray-500">{currentIdx + 1}/{questions.length}</span>
          <div className={cn("flex items-center gap-1 font-mono text-sm font-bold px-3 py-1 rounded-lg", timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
            <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {currentPartPassage && (
        <AudioPlayer
          text={currentPartPassage}
          partLabel={`Part ${current.partNumber || 1}`}
        />
      )}

      {/* Part tips */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4">
        <p className="text-xs font-semibold text-purple-700 mb-1.5">💡 Tips Part {current.partNumber || 1}:</p>
        <p className="text-xs text-purple-800">{partTips[0]}</p>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0">{currentIdx + 1}</span>
          <p className="text-gray-800 font-medium">{current.question}</p>
        </div>
        {options.length > 0 ? (
          <div className="space-y-2">
            {options.map((opt, i) => (
              <button key={i} onClick={() => { setAnswers(p => ({ ...p, [current.id]: opt })); setShowExplanation(false); }}
                className={cn("w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors",
                  userAnswer === opt ? "border-purple-500 bg-purple-50 text-purple-800" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            ))}
          </div>
        ) : (
          <input type="text" placeholder="Tulis jawabanmu..." value={userAnswer || ""}
            onChange={e => setAnswers(p => ({ ...p, [current.id]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        )}

        {userAnswer && (
          <div className="mt-3">
            <button onClick={() => setShowExplanation(!showExplanation)} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> {showExplanation ? "Sembunyikan" : "Cek Jawaban"}
            </button>
            {showExplanation && (
              <div className={cn("mt-2 p-3 rounded-lg text-sm", userAnswer?.toLowerCase().trim() === current.answer.toLowerCase().trim() ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                {userAnswer?.toLowerCase().trim() === current.answer.toLowerCase().trim() ? "✓ Benar!" : `✗ Salah. Jawaban: ${current.answer}`}
                {current.explanation && <p className="text-gray-600 mt-1 text-xs">{current.explanation}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => { setCurrentIdx(p => Math.max(0, p - 1)); setShowExplanation(false); }} disabled={currentIdx === 0}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Sebelumnya</button>
        {currentIdx < questions.length - 1 ? (
          <button onClick={() => { setCurrentIdx(p => p + 1); setShowExplanation(false); }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-1">
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
