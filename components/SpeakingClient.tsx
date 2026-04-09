"use client";

import { useState, useRef, useEffect } from "react";
import { cn, bandScoreBg } from "@/lib/utils";
import { Mic, MicOff, Square, ChevronRight, Lightbulb, CheckCircle, RotateCcw } from "lucide-react";

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
  1: ["Jawab dengan 2-3 kalimat lengkap, bukan satu kata. Expand your answer!", "Gunakan varied vocabulary — avoid repeating the same words.", "It's okay to take 1-2 detik untuk berpikir sebelum menjawab."],
  2: ["Gunakan 1 menit penuh untuk prepare — tulis kata kunci, bukan kalimat penuh.", "Bicaralah selama hampir 2 menit — gunakan semua poin di cue card.", "Gunakan past tense dan time markers: 'When I was...', 'At that time...'"],
  3: ["Express opinions clearly: 'In my opinion...', 'I strongly believe...'", "Give reasons AND examples untuk setiap pendapat.", "Extend answers dengan menanyakan balik konsep: 'This links to the broader issue of...'"],
};

export default function SpeakingClient({ data }: Props) {
  const { recent } = data;
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"practice" | "feedback" | "history">("practice");
  const [recordingTime, setRecordingTime] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = SPEAKING_QUESTIONS[part];
  const currentQuestion = questions[questionIdx];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getSpeechRecognition(): any {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }

  useEffect(() => {
    if (!getSpeechRecognition()) {
      setSpeechSupported(false);
      setUseManual(true);
    }
  }, []);

  function startRecording() {
    if (useManual) { setRecording(true); setRecordingTime(0); timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000); return; }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript + interim);
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

  async function submitForFeedback() {
    const text = useManual ? manualTranscript : transcript;
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/speaking/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part, question: currentQuestion, transcript: text, duration: recordingTime }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setFeedback(json.feedback);
      setView("feedback");
    } catch {
      setError("Gagal connect ke AI.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setView("practice");
    setFeedback(null);
    setTranscript("");
    setManualTranscript("");
    setRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  if (view === "feedback" && feedback) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6 text-red-600" /> Speaking Feedback
          </h1>
          <span className={cn("text-sm font-bold px-3 py-1 rounded-lg", bandScoreBg(feedback.overallBand))}>
            Band {feedback.overallBand.toFixed(1)}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Part {part}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            ["Fluency & Coherence", feedback.subscores.fluencyCoherence],
            ["Lexical Resource", feedback.subscores.lexicalResource],
            ["Grammar Range", feedback.subscores.grammaticalRange],
            ["Pronunciation", feedback.subscores.pronunciation],
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
            <ul className="space-y-1">
              {feedback.strengths.map((s, i) => <li key={i} className="text-sm text-green-900 flex gap-2"><span>•</span>{s}</li>)}
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-orange-800 mb-2">To Improve</h3>
            <ul className="space-y-1">
              {feedback.improvements.map((s, i) => <li key={i} className="text-sm text-orange-900 flex gap-2"><span>•</span>{s}</li>)}
            </ul>
          </div>
        </div>

        {feedback.betterPhrases.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Better Phrases</h3>
            {feedback.betterPhrases.map((p, i) => (
              <div key={i} className="text-sm mb-2">
                <p className="text-red-500">You said: "{p.said}"</p>
                <p className="text-green-700 flex items-center gap-1"><ChevronRight className="w-3 h-3" />Better: "{p.better}"</p>
              </div>
            ))}
          </div>
        )}

        {feedback.tips.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" /> Tips
            </h3>
            <ul className="space-y-1">
              {feedback.tips.map((t, i) => <li key={i} className="text-sm text-blue-900 flex gap-2"><span>•</span>{t}</li>)}
            </ul>
          </div>
        )}

        <button onClick={reset} className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Practice Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-red-600" /> Speaking Practice
        </h1>
        <button onClick={() => setView(view === "history" ? "practice" : "history")} className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
          {view === "history" ? "Back" : `History (${recent.length})`}
        </button>
      </div>

      {view === "history" ? (
        <div className="space-y-3">
          {recent.length === 0 ? <p className="text-gray-400 text-sm text-center py-12">Belum ada riwayat.</p> :
            recent.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium mr-2">Part {s.part}</span>
                  <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString("id-ID")}</span>
                  <p className="text-sm text-gray-600 mt-1 truncate max-w-xs">{s.question}</p>
                </div>
                {s.bandScore && <span className={cn("text-sm font-bold px-3 py-1 rounded-lg shrink-0", bandScoreBg(s.bandScore))}>Band {s.bandScore.toFixed(1)}</span>}
              </div>
            ))
          }
        </div>
      ) : (
        <>
          {/* Part selector */}
          <div className="flex gap-2 mb-4">
            {([1, 2, 3] as const).map((p) => (
              <button key={p} onClick={() => { setPart(p); setQuestionIdx(0); reset(); }}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", part === p ? "bg-red-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                Part {p}
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-800">Tips Part {part}</span>
            </div>
            <ul className="space-y-1">
              {SPEAKING_TIPS[part].map((t, i) => <li key={i} className="text-xs text-red-900 flex gap-1.5"><span>•</span>{t}</li>)}
            </ul>
          </div>

          {/* Question */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Part {part} — Question {questionIdx + 1}/{questions.length}</span>
              <button onClick={() => setQuestionIdx((i) => (i + 1) % questions.length)} className="text-xs text-blue-600 hover:underline">Next question →</button>
            </div>
            {part === 2 && <p className="text-xs text-gray-400 mb-2">You have 1 minute to prepare. Talk for up to 2 minutes.</p>}
            <p className="text-gray-800 font-medium leading-relaxed">{currentQuestion}</p>
          </div>

          {/* Recording */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            {!speechSupported && (
              <p className="text-xs text-orange-600 mb-3 bg-orange-50 border border-orange-200 rounded-lg p-2">
                Browser tidak support Speech Recognition. Gunakan mode ketik manual.
              </p>
            )}

            <div className="flex items-center gap-3 mb-4">
              {speechSupported && (
                <button
                  onClick={() => setUseManual(!useManual)}
                  className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                >
                  {useManual ? "Switch to mic" : "Switch to manual"}
                </button>
              )}
              {recording && (
                <div className="flex items-center gap-1.5 text-red-600">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-mono">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}</span>
                </div>
              )}
            </div>

            {useManual ? (
              <textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Ketik apa yang kamu ucapkan di sini..."
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            ) : (
              <div className="min-h-24 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-3">
                {transcript || <span className="text-gray-400">Transcript akan muncul di sini saat merekam...</span>}
              </div>
            )}

            <div className="flex gap-3 mt-3">
              {!recording ? (
                <button onClick={startRecording} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700">
                  <Mic className="w-4 h-4" /> {useManual ? "Start Timer" : "Start Recording"}
                </button>
              ) : (
                <button onClick={stopRecording} className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900">
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}
              {(useManual ? manualTranscript : transcript) && !recording && (
                <button onClick={() => useManual ? setManualTranscript("") : setTranscript("")} className="text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <MicOff className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            onClick={submitForFeedback}
            disabled={loading || !(useManual ? manualTranscript : transcript).trim()}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <>Get AI Feedback <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </>
      )}
    </div>
  );
}
