"use client";

import { useState, useRef, useEffect } from "react";
import { cn, bandScoreBg } from "@/lib/utils";
import {
  Mic, MicOff, Square, ChevronRight, Lightbulb,
  CheckCircle, RotateCcw, ArrowRight, Trophy, Star,
} from "lucide-react";

interface Submission {
  id: number;
  part: number;
  question: string;
  bandScore: number | null;
  createdAt: Date;
}

interface Props {
  data: { recent: Submission[] };
}

interface AiFeedback {
  overallBand: number;
  subscores: {
    fluencyCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    pronunciation: number;
  };
  strengths: string[];
  improvements: string[];
  betterPhrases: { said: string; better: string }[];
  tips: string[];
}

interface QuestionResult {
  question: string;
  transcript: string;
  feedback: AiFeedback;
  duration: number;
}

const SPEAKING_QUESTIONS = {
  1: [
    "Tell me about your hometown. What do you like most about it?",
    "Do you enjoy cooking? Why or why not?",
    "How do you usually spend your weekends?",
    "What kind of music do you like? Why?",
    "Do you prefer reading books or watching movies? Why?",
  ],
  2: [
    "Describe a person who has had a significant influence on your life. You should say: who this person is, how you know them, what they do, and explain how they have influenced you.",
    "Describe a place you have visited that you particularly enjoyed. You should say: where it was, why you went there, what you did there, and explain why you enjoyed it so much.",
    "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would benefit you.",
  ],
  3: [
    "How has technology changed the way people communicate in your country?",
    "Do you think social media has a positive or negative effect on society? Why?",
    "What are the main environmental problems facing your country today?",
    "How important is it for young people to learn about history?",
    "Do you think the gap between rich and poor is increasing or decreasing? Why?",
  ],
};

const SPEAKING_TIPS = {
  1: [
    "Jawab dengan 2-3 kalimat lengkap. Expand your answer!",
    "Gunakan varied vocabulary — avoid repeating the same words.",
    "Boleh ambil 1-2 detik untuk berpikir sebelum menjawab.",
  ],
  2: [
    "Gunakan 1 menit penuh untuk prepare — tulis kata kunci.",
    "Bicaralah hampir 2 menit — gunakan semua poin di cue card.",
    "Gunakan past tense dan time markers: 'When I was...', 'At that time...'",
  ],
  3: [
    "Express opinions clearly: 'In my opinion...', 'I strongly believe...'",
    "Give reasons AND examples untuk setiap pendapat.",
    "Extend answers: 'This links to the broader issue of...'",
  ],
};

// ── Recording UI ──────────────────────────────────────────────────────────────
function RecordingPanel({
  question,
  questionNum,
  totalQuestions,
  part,
  onFeedback,
}: {
  question: string;
  questionNum: number;
  totalQuestions: number;
  part: 1 | 2 | 3;
  onFeedback: (result: Omit<QuestionResult, "feedback"> & { feedback: AiFeedback }) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [prepTime, setPrepTime] = useState(part === 2 ? 60 : 0);
  const [prepActive, setPrepActive] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSpeechSupported(false); setUseManual(true); }
  }, []);

  // Prep timer for Part 2
  function startPrep() {
    setPrepActive(true);
    prepTimerRef.current = setInterval(() => {
      setPrepTime((p) => {
        if (p <= 1) { clearInterval(prepTimerRef.current!); setPrepActive(false); return 0; }
        return p - 1;
      });
    }, 1000);
  }

  function startRecording() {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setPrepActive(false);

    if (useManual) {
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      setTranscript(finalText + interim);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  async function submit() {
    const text = useManual ? manualTranscript : transcript;
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/speaking/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part, question, transcript: text, duration: recordingTime }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      onFeedback({ question, transcript: text, feedback: json.feedback, duration: recordingTime });
    } catch {
      setError("Gagal connect ke AI. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const text = useManual ? manualTranscript : transcript;
  const canSubmit = text.trim().length > 0 && !recording;

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
            Part {part} — Soal {questionNum} / {totalQuestions}
          </span>
          {part === 2 && (
            <span className="text-xs text-gray-400">Talk for ~2 minutes</span>
          )}
        </div>
        <p className="text-gray-800 font-medium leading-relaxed">{question}</p>

        {/* Part 2 prep timer */}
        {part === 2 && (
          <div className="mt-3 flex items-center gap-3">
            {!prepActive && prepTime > 0 && !recording && (
              <button onClick={startPrep} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200">
                ⏱ Mulai 1 menit persiapan
              </button>
            )}
            {prepActive && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-mono font-semibold">
                  Prep: {Math.floor(prepTime / 60)}:{String(prepTime % 60).padStart(2, "0")}
                </span>
              </div>
            )}
            {prepTime === 0 && !recording && <span className="text-xs text-gray-400">Prep selesai — mulai rekam!</span>}
          </div>
        )}
      </div>

      {/* Recording panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {!speechSupported && (
          <div className="mb-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">
            Browser tidak support Speech Recognition. Gunakan mode ketik manual.
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          {speechSupported && (
            <button
              onClick={() => setUseManual(!useManual)}
              className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
            >
              {useManual ? "🎤 Switch ke mic" : "⌨️ Switch ke manual"}
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-1.5 text-red-600">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono font-semibold">
                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
              </span>
              {part === 2 && recordingTime >= 120 && (
                <span className="text-xs text-orange-500 ml-1">✓ Cukup, bisa stop</span>
              )}
            </div>
          )}
        </div>

        {useManual ? (
          <textarea
            value={manualTranscript}
            onChange={(e) => setManualTranscript(e.target.value)}
            placeholder="Ketik jawaban kamu di sini (simulasikan apa yang akan kamu ucapkan)..."
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        ) : (
          <div className="min-h-20 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-3 leading-relaxed">
            {transcript || <span className="text-gray-400 italic">Transcript akan muncul saat merekam...</span>}
          </div>
        )}

        <div className="flex gap-3 mt-3">
          {!recording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Mic className="w-4 h-4" />
              {useManual ? "Mulai Timer" : "Mulai Rekam"}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          )}

          {text && !recording && (
            <button
              onClick={() => useManual ? setManualTranscript("") : setTranscript("")}
              className="text-sm text-gray-400 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <MicOff className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {/* Submit button */}
      <button
        onClick={submit}
        disabled={!canSubmit || loading}
        className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing dengan AI...</>
        ) : (
          <>Submit & Get AI Feedback <ChevronRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

// ── Per-question Feedback ─────────────────────────────────────────────────────
function FeedbackCard({ result, onNext, isLast }: { result: QuestionResult; onNext: () => void; isLast: boolean }) {
  const { feedback } = result;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-1">Pertanyaan:</p>
        <p className="text-sm font-medium text-gray-800">{result.question}</p>
        <p className="text-xs text-gray-400 mt-2 italic">"{result.transcript.slice(0, 150)}{result.transcript.length > 150 ? "..." : ""}"</p>
      </div>

      <div className="flex items-center gap-3">
        <span className={cn("text-xl font-bold px-4 py-2 rounded-xl", bandScoreBg(feedback.overallBand))}>
          Band {feedback.overallBand.toFixed(1)}
        </span>
        <div className="grid grid-cols-2 gap-2 flex-1">
          {[
            ["F&C", feedback.subscores.fluencyCoherence],
            ["Lex", feedback.subscores.lexicalResource],
            ["Gram", feedback.subscores.grammaticalRange],
            ["Pron", feedback.subscores.pronunciation],
          ].map(([label, score]) => (
            <div key={label as string} className="bg-gray-50 rounded-lg px-2 py-1 text-center">
              <span className="text-xs text-gray-500">{label as string} </span>
              <span className="text-xs font-bold text-gray-800">{(score as number).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-green-800 mb-1.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Strengths
          </h4>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => <li key={i} className="text-xs text-green-900 flex gap-1.5"><span>•</span>{s}</li>)}
          </ul>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-orange-800 mb-1.5">To Improve</h4>
          <ul className="space-y-1">
            {feedback.improvements.map((s, i) => <li key={i} className="text-xs text-orange-900 flex gap-1.5"><span>•</span>{s}</li>)}
          </ul>
        </div>
      </div>

      {feedback.betterPhrases.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Better Phrases</h4>
          {feedback.betterPhrases.slice(0, 2).map((p, i) => (
            <div key={i} className="text-xs mb-1.5">
              <span className="text-red-500">"{p.said}" </span>
              <ChevronRight className="w-3 h-3 inline text-gray-400" />
              <span className="text-green-700"> "{p.better}"</span>
            </div>
          ))}
        </div>
      )}

      {feedback.tips.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-blue-800 mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Tips
          </h4>
          <ul className="space-y-1">
            {feedback.tips.slice(0, 2).map((t, i) => <li key={i} className="text-xs text-blue-900 flex gap-1.5"><span>•</span>{t}</li>)}
          </ul>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors bg-red-600 text-white hover:bg-red-700"
      >
        {isLast ? (
          <><Trophy className="w-4 h-4" /> Lihat Summary Akhir</>
        ) : (
          <>Lanjut ke Soal Berikutnya <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

// ── Final Summary ─────────────────────────────────────────────────────────────
function FinalSummary({ results, part, onRestart }: { results: QuestionResult[]; part: 1 | 2 | 3; onRestart: () => void }) {
  const avg = results.reduce((sum, r) => sum + r.feedback.overallBand, 0) / results.length;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 text-center">
        <Trophy className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Part {part} Selesai!</h2>
        <p className="text-sm text-gray-500 mb-3">Kamu menjawab {results.length} pertanyaan</p>
        <div className={cn("inline-block text-3xl font-bold px-6 py-3 rounded-2xl", bandScoreBg(avg))}>
          Band {avg.toFixed(1)}
        </div>
        <p className="text-xs text-gray-400 mt-2">Rata-rata dari {results.length} jawaban</p>
      </div>

      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Soal {i + 1}</p>
                <p className="text-sm font-medium text-gray-700">{r.question}</p>
                <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{r.transcript.slice(0, 100)}..."</p>
              </div>
              <span className={cn("text-sm font-bold px-3 py-1 rounded-lg shrink-0", bandScoreBg(r.feedback.overallBand))}>
                {r.feedback.overallBand.toFixed(1)}
              </span>
            </div>

            {/* Subscore mini bar */}
            <div className="mt-2 flex gap-2">
              {[
                ["F&C", r.feedback.subscores.fluencyCoherence],
                ["Lex", r.feedback.subscores.lexicalResource],
                ["Gram", r.feedback.subscores.grammaticalRange],
                ["Pron", r.feedback.subscores.pronunciation],
              ].map(([label, score]) => (
                <div key={label as string} className="bg-gray-50 rounded px-1.5 py-0.5 text-center">
                  <span className="text-xs text-gray-400">{label as string} </span>
                  <span className="text-xs font-semibold">{(score as number).toFixed(1)}</span>
                </div>
              ))}
            </div>

            {/* Top improvement */}
            {r.feedback.improvements[0] && (
              <p className="text-xs text-orange-700 mt-2 bg-orange-50 rounded px-2 py-1">
                ⚡ {r.feedback.improvements[0]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700"
        >
          <RotateCcw className="w-4 h-4" /> Practice Lagi
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SpeakingClient({ data }: Props) {
  const { recent } = data;
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [phase, setPhase] = useState<"record" | "feedback" | "summary">("record");
  const [view, setView] = useState<"practice" | "history">("practice");

  const questions = SPEAKING_QUESTIONS[part];
  const currentQuestion = questions[questionIdx];

  function handleFeedback(result: QuestionResult) {
    const newResults = [...results, result];
    setResults(newResults);
    setPhase("feedback");
  }

  function handleNext() {
    if (questionIdx + 1 >= questions.length) {
      setPhase("summary");
    } else {
      setQuestionIdx((i) => i + 1);
      setPhase("record");
    }
  }

  function handleRestart() {
    setResults([]);
    setQuestionIdx(0);
    setPhase("record");
  }

  function switchPart(p: 1 | 2 | 3) {
    setPart(p);
    setResults([]);
    setQuestionIdx(0);
    setPhase("record");
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Mic className="w-5 h-5 text-red-600" /> Speaking Practice
        </h1>
        <button
          onClick={() => setView(view === "history" ? "practice" : "history")}
          className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          {view === "history" ? "Back" : `History (${recent.length})`}
        </button>
      </div>

      {view === "history" ? (
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">Belum ada riwayat.</p>
          ) : (
            recent.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium mr-2">Part {s.part}</span>
                  <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString("id-ID")}</span>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1 max-w-xs">{s.question}</p>
                </div>
                {s.bandScore && (
                  <span className={cn("text-sm font-bold px-3 py-1 rounded-lg shrink-0", bandScoreBg(s.bandScore))}>
                    Band {s.bandScore.toFixed(1)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Part selector — only show when not in middle of session */}
          {phase === "record" && questionIdx === 0 && (
            <>
              <div className="flex gap-2 mb-4">
                {([1, 2, 3] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => switchPart(p)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      part === p ? "bg-red-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    Part {p}
                  </button>
                ))}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">Tips Part {part}</span>
                </div>
                <ul className="space-y-1">
                  {SPEAKING_TIPS[part].map((t, i) => (
                    <li key={i} className="text-xs text-red-900 flex gap-1.5"><span>•</span>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: "0%" }} />
                </div>
                <span className="text-xs text-gray-400">0 / {questions.length} done</span>
              </div>
            </>
          )}

          {/* Progress bar mid-session */}
          {(phase === "record" && questionIdx > 0) || phase === "feedback" ? (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(results.length / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{results.length} / {questions.length} done</span>
            </div>
          ) : null}

          {/* Stars summary */}
          {results.length > 0 && phase !== "summary" && (
            <div className="flex gap-1 mb-3">
              {questions.map((_, i) => (
                <div key={i} className={cn(
                  "flex-1 h-1.5 rounded-full",
                  i < results.length
                    ? results[i].feedback.overallBand >= 6
                      ? "bg-green-400"
                      : results[i].feedback.overallBand >= 5
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    : "bg-gray-200"
                )} />
              ))}
            </div>
          )}

          {phase === "record" && (
            <RecordingPanel
              key={`${part}-${questionIdx}`}
              question={currentQuestion}
              questionNum={questionIdx + 1}
              totalQuestions={questions.length}
              part={part}
              onFeedback={handleFeedback}
            />
          )}

          {phase === "feedback" && results.length > 0 && (
            <FeedbackCard
              result={results[results.length - 1]}
              onNext={handleNext}
              isLast={questionIdx + 1 >= questions.length}
            />
          )}

          {phase === "summary" && (
            <FinalSummary results={results} part={part} onRestart={handleRestart} />
          )}
        </>
      )}
    </div>
  );
}
