"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, bandScoreBg } from "@/lib/utils";
import { ClipboardList, Clock, BookOpen, Headphones, PenLine, Mic, ChevronRight, Target } from "lucide-react";

interface MockTest {
  id: number;
  totalScore: number | null;
  readingScore: number | null;
  listeningScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  completed: boolean;
  createdAt: Date;
}

interface Props {
  data: { mockTests: MockTest[]; targetBand: number };
}

const SECTIONS = [
  { key: "listening", label: "Listening", icon: Headphones, time: "30 min", href: "/listening", color: "bg-purple-50 text-purple-600 border-purple-200", note: "40 questions, 4 parts" },
  { key: "reading", label: "Reading", icon: BookOpen, time: "60 min", href: "/reading", color: "bg-blue-50 text-blue-600 border-blue-200", note: "40 questions, 3 passages" },
  { key: "writing", label: "Writing", icon: PenLine, time: "60 min", href: "/writing", color: "bg-green-50 text-green-600 border-green-200", note: "Task 1 (20 min) + Task 2 (40 min)" },
  { key: "speaking", label: "Speaking", icon: Mic, time: "11-14 min", href: "/speaking", color: "bg-red-50 text-red-600 border-red-200", note: "Part 1, 2, 3" },
];

function overallBand(scores: (number | null)[]): number {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg * 2) / 2;
}

export default function MockTestClient({ data }: Props) {
  const { mockTests, targetBand } = data;
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveScores() {
    const r = parseFloat(scores.reading || "0") || null;
    const l = parseFloat(scores.listening || "0") || null;
    const w = parseFloat(scores.writing || "0") || null;
    const sp = parseFloat(scores.speaking || "0") || null;
    const total = overallBand([r, l, w, sp]);

    setSaving(true);
    await fetch("/api/mock-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readingScore: r, listeningScore: l, writingScore: w, speakingScore: sp, totalScore: total }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => window.location.reload(), 1000);
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-orange-600" /> Mock Test
        </h1>
        <p className="text-gray-500 text-sm mt-1">Full IELTS simulation — Total: ~2h 45min</p>
      </div>

      {/* Target banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Target className="w-5 h-5 text-orange-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-orange-800">Target Band: {targetBand.toFixed(1)}</p>
          <p className="text-xs text-orange-600">Lakukan full mock test secara rutin untuk mengukur progress kamu.</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Cara Mengerjakan Mock Test</h2>
        <div className="space-y-3">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border flex-1", s.color)}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">{s.label}</span>
                    <span className="text-xs ml-2 opacity-70">{s.note}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    <Clock className="w-3 h-3" />{s.time}
                  </div>
                </div>
                <Link href={s.href} className="text-xs bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1 shrink-0">
                  Mulai <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score entry */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Input Skor Mock Test</h2>
        <p className="text-xs text-gray-400 mb-4">Setelah selesai semua section, masukkan band score estimasi di sini untuk tracking.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {SECTIONS.map((s) => (
            <div key={s.key}>
              <label className="text-xs font-medium text-gray-500 block mb-1">{s.label}</label>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                placeholder="0.0"
                value={scores[s.key] || ""}
                onChange={(e) => setScores((p) => ({ ...p, [s.key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ))}
        </div>
        {Object.values(scores).some((v) => v) && (
          <div className="bg-orange-50 rounded-lg p-3 mb-3 text-center">
            <p className="text-xs text-orange-600">Overall Band (estimasi)</p>
            <p className="text-3xl font-bold text-orange-700">
              {overallBand([
                parseFloat(scores.reading || "0") || null,
                parseFloat(scores.listening || "0") || null,
                parseFloat(scores.writing || "0") || null,
                parseFloat(scores.speaking || "0") || null,
              ]).toFixed(1)}
            </p>
          </div>
        )}
        <button
          onClick={saveScores}
          disabled={saving || saved || !Object.values(scores).some((v) => v)}
          className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {saved ? "Tersimpan!" : saving ? "Menyimpan..." : "Simpan Skor"}
        </button>
      </div>

      {/* History */}
      {mockTests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Mock Test History</h2>
          <div className="space-y-3">
            {mockTests.map((t) => (
              <div key={t.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {t.totalScore && (
                    <span className={cn("text-sm font-bold px-3 py-0.5 rounded-lg", bandScoreBg(t.totalScore))}>
                      Overall {t.totalScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[["L", t.listeningScore], ["R", t.readingScore], ["W", t.writingScore], ["S", t.speakingScore]].map(([label, score]) => (
                    <div key={label as string} className="text-center">
                      <p className="text-xs text-gray-400">{label as string}</p>
                      <p className={cn("text-sm font-bold", score ? bandScoreBg(score as number).split(" ")[1] : "text-gray-300")}>
                        {score ? (score as number).toFixed(1) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
