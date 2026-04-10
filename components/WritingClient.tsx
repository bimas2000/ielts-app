"use client";

import { useState, useEffect, useRef } from "react";
import { cn, formatTime, countWords, bandScoreBg } from "@/lib/utils";
import { PenLine, Clock, Lightbulb, CheckCircle, ChevronRight, RotateCcw } from "lucide-react";

interface Prompt {
  id: number;
  taskType: string;
  prompt: string;
}

interface Submission {
  id: number;
  taskType: string;
  bandScore: number | null;
  wordCount: number | null;
  createdAt: Date;
  prompt: string;
}

interface Props {
  data: {
    prompts: Prompt[];
    recentSubmissions: Submission[];
  };
}

interface AiFeedback {
  overallBand: number;
  subscores: {
    taskAchievement: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalRange: number;
  };
  strengths: string[];
  improvements: string[];
  corrections: { original: string; improved: string }[];
  tips: string[];
}

const WRITING_TIPS = {
  task1: [
    "Overview wajib ada — tulis di paragraf 2 setelah intro. Tanpa overview, band turun signifikan.",
    "Grouping data: jangan describe semua angka satu per satu. Kelompokkan tren/pola.",
    "Gunakan passive voice dan varied reporting verbs: 'it can be seen', 'the data reveals'.",
    "150 kata minimum — idealnya 170-190 kata. Jangan under/over describe.",
    "Untuk pie/bar chart: fokus pada angka yang paling menonjol (tertinggi, terendah, tren besar).",
  ],
  task2: [
    "Structure: Introduction + 2 body paragraphs + Conclusion. Jangan skip struktur ini.",
    "Intro: Paraphrase topik + thesis statement. JANGAN copy soal kata per kata.",
    "Setiap body paragraph: Topic sentence + Explanation + Example/Evidence.",
    "250 kata minimum — idealnya 280-320 kata. Jangan terlalu panjang tanpa substansi.",
    "Coherence: Gunakan linkers (However, Furthermore, In contrast) tapi jangan berlebihan.",
    "Lexical resource: Avoid repetition — gunakan sinonim. Ini salah satu penilaian utama.",
  ],
};

const SAMPLE_PROMPTS = {
  task1: "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  task2: "Some people think that the government should provide financial assistance to all artists, including painters, musicians and poets. Others believe that these funds should only go to those whose work is of the highest quality. Discuss both views and give your own opinion.",
};

export default function WritingClient({ data }: Props) {
  const { prompts, recentSubmissions } = data;
  const [taskType, setTaskType] = useState<"task1" | "task2">("task2");
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS.task2);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(taskType === "task1" ? 20 * 60 : 40 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"write" | "feedback" | "history">("write");
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setTimeLeft(taskType === "task1" ? 20 * 60 : 40 * 60);
    setPrompt(SAMPLE_PROMPTS[taskType]);
  }, [taskType]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft]);

  function startTimer() {
    setTimerActive(true);
    startTimeRef.current = Date.now();
  }

  async function submitForCheck() {
    if (!response.trim()) return;
    setLoading(true);
    setError("");
    setTimerActive(false);
    const elapsed = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : null;
    setTimeTaken(elapsed || 0);

    try {
      const res = await fetch("/api/writing/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType, prompt, response, timeTaken: elapsed }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setFeedback(json.feedback);
      setView("feedback");
    } catch {
      setError("Gagal terhubung ke AI. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const wc = countWords(response);
  const minWords = taskType === "task1" ? 150 : 250;

  if (view === "feedback" && feedback) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenLine className="w-6 h-6 text-green-600" /> Writing Feedback
          </h1>
          <span className={cn("text-sm font-bold px-3 py-1 rounded-lg", bandScoreBg(feedback.overallBand))}>
            Band {feedback.overallBand.toFixed(1)}
          </span>
          {timeTaken > 0 && <span className="text-xs text-gray-400">{formatTime(timeTaken)}</span>}
        </div>

        {/* Subscores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            ["Task Achievement", feedback.subscores.taskAchievement],
            ["Coherence & Cohesion", feedback.subscores.coherenceCohesion],
            ["Lexical Resource", feedback.subscores.lexicalResource],
            ["Grammar Range", feedback.subscores.grammaticalRange],
          ].map(([label, score]) => (
            <div key={label as string} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className={cn("text-2xl font-bold", bandScoreBg(score as number).split(" ")[0].replace("bg-", "text-").replace("-100", "-600"))}>{(score as number).toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label as string}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Strengths
            </h3>
            <ul className="space-y-1.5">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-900 flex gap-2"><span>•</span>{s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-orange-800 mb-2">Areas to Improve</h3>
            <ul className="space-y-1.5">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="text-sm text-orange-900 flex gap-2"><span>•</span>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {feedback.corrections.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Corrections</h3>
            <div className="space-y-3">
              {feedback.corrections.map((c, i) => (
                <div key={i} className="text-sm">
                  <p className="text-red-600 line-through">{c.original}</p>
                  <p className="text-green-700 flex items-center gap-1"><ChevronRight className="w-3 h-3" />{c.improved}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {feedback.tips.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" /> Tips for You
            </h3>
            <ul className="space-y-1.5">
              {feedback.tips.map((t, i) => (
                <li key={i} className="text-sm text-blue-900 flex gap-2"><span>•</span>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => { setView("write"); setFeedback(null); setResponse(""); setTimerActive(false); setTimeLeft(taskType === "task1" ? 20 * 60 : 40 * 60); }}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Latihan Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PenLine className="w-6 h-6 text-green-600" /> Writing Practice
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setView(view === "history" ? "write" : "history")} className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            {view === "history" ? "Back to Write" : `History (${recentSubmissions.length})`}
          </button>
        </div>
      </div>

      {view === "history" ? (
        <HistoryView submissions={recentSubmissions} />
      ) : (
        <>
          {/* Task selector */}
          <div className="flex gap-2 mb-4">
            {(["task1", "task2"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTaskType(t)}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", taskType === t ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50")}
              >
                {t === "task1" ? "Task 1 (20 min)" : "Task 2 (40 min)"}
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-800">Tips {taskType === "task1" ? "Task 1" : "Task 2"}</span>
            </div>
            <ul className="space-y-1">
              {WRITING_TIPS[taskType].slice(0, 3).map((t, i) => (
                <li key={i} className="text-xs text-yellow-900 flex gap-1.5"><span>•</span>{t}</li>
              ))}
            </ul>
          </div>

          {/* Task 1 Chart */}
          {taskType === "task1" && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sample Chart — Task 1</p>
              <svg viewBox="0 0 480 200" className="w-full" aria-label="Bar chart showing household ownership vs renting in England and Wales 1918-2011">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <g key={v}>
                    <line x1="50" y1={170 - v * 1.4} x2="460" y2={170 - v * 1.4} stroke="#f0f0f0" strokeWidth="1" />
                    <text x="44" y={174 - v * 1.4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}%</text>
                  </g>
                ))}
                {/* Bars for Owned */}
                {[
                  { year: "1918", owned: 23, x: 72 },
                  { year: "1939", owned: 32, x: 130 },
                  { year: "1953", owned: 32, x: 188 },
                  { year: "1961", owned: 43, x: 246 },
                  { year: "1971", owned: 52, x: 304 },
                  { year: "1981", owned: 58, x: 362 },
                  { year: "2001", owned: 70, x: 420 },
                ].map(({ year, owned, x }) => (
                  <g key={year}>
                    <rect x={x - 12} y={170 - owned * 1.4} width="11" height={owned * 1.4} fill="#3b82f6" rx="1" />
                    <rect x={x + 1} y={170 - (100 - owned) * 1.4} width="11" height={(100 - owned) * 1.4} fill="#f97316" rx="1" />
                    <text x={x + 1} y="185" textAnchor="middle" fontSize="8" fill="#6b7280">{year}</text>
                  </g>
                ))}
                {/* Legend */}
                <rect x="55" y="10" width="10" height="8" fill="#3b82f6" rx="1" />
                <text x="68" y="18" fontSize="9" fill="#374151">Owned</text>
                <rect x="110" y="10" width="10" height="8" fill="#f97316" rx="1" />
                <text x="123" y="18" fontSize="9" fill="#374151">Rented</text>
                <text x="265" y="12" textAnchor="middle" fontSize="10" fill="#111827" fontWeight="600">Household Tenure in England &amp; Wales (%)</text>
              </svg>
              <p className="text-xs text-gray-400 mt-1 text-center">Gunakan data chart ini sebagai referensi untuk menulis Task 1</p>
            </div>
          )}

          {/* Prompt selector */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Prompt</label>
            {prompts.filter((p) => p.taskType === taskType).length > 0 ? (
              <select
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
              >
                <option value={SAMPLE_PROMPTS[taskType]}>— Gunakan prompt contoh —</option>
                {prompts.filter((p) => p.taskType === taskType).map((p) => (
                  <option key={p.id} value={p.prompt}>{p.prompt.substring(0, 80)}...</option>
                ))}
              </select>
            ) : null}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Paste atau edit prompt di sini..."
            />
          </div>

          {/* Response area */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Your Response</label>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-medium", wc >= minWords ? "text-green-600" : "text-orange-500")}>
                  {wc} words {wc < minWords && `(min ${minWords})`}
                </span>
                {timerActive ? (
                  <div className={cn("flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded", timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
                    <Clock className="w-3 h-3" /> {formatTime(timeLeft)}
                  </div>
                ) : (
                  <button onClick={startTimer} className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Start Timer
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={14}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-[inherit] leading-relaxed"
              placeholder="Write your response here..."
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            onClick={submitForCheck}
            disabled={loading || wc < 30}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking with AI...
              </>
            ) : (
              <>Check with AI <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
          {wc < 30 && <p className="text-xs text-gray-400 text-center mt-1">Tulis minimal 30 kata untuk bisa di-check</p>}
        </>
      )}
    </div>
  );
}

function HistoryView({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-12">Belum ada riwayat writing.</p>;
  }
  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                  {s.taskType === "task1" ? "Task 1" : "Task 2"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(s.createdAt).toLocaleDateString("id-ID")}
                </span>
                {s.wordCount && <span className="text-xs text-gray-400">{s.wordCount} words</span>}
              </div>
              <p className="text-sm text-gray-600 truncate">{s.prompt}</p>
            </div>
            {s.bandScore && (
              <span className={cn("text-sm font-bold px-3 py-1 rounded-lg shrink-0", bandScoreBg(s.bandScore))}>
                Band {s.bandScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
