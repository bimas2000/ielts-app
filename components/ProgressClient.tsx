"use client";

import { cn, bandScoreBg } from "@/lib/utils";
import { BarChart3, TrendingUp, BookOpen, Headphones, PenLine, Mic } from "lucide-react";

interface Session {
  id: number;
  section: string;
  bandScore: number | null;
  score: number | null;
  createdAt: Date;
}

interface Props {
  data: {
    sessions: Session[];
    writingSubmissions: { id: number; taskType: string; bandScore: number | null; wordCount: number | null; createdAt: Date }[];
    speakingSubmissions: { id: number; part: number; bandScore: number | null; createdAt: Date }[];
    vocabTotal: number;
    masteredVocab: number;
  };
}

const SECTIONS = [
  { key: "reading", label: "Reading", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  { key: "listening", label: "Listening", icon: Headphones, color: "text-purple-600 bg-purple-50" },
  { key: "writing", label: "Writing", icon: PenLine, color: "text-green-600 bg-green-50" },
  { key: "speaking", label: "Speaking", icon: Mic, color: "text-red-600 bg-red-50" },
];

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function BandBar({ score }: { score: number }) {
  const pct = ((score - 0) / 9) * 100;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={cn("h-2 rounded-full transition-all", score >= 7 ? "bg-green-500" : score >= 6 ? "bg-blue-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ProgressClient({ data }: Props) {
  const { sessions, writingSubmissions, speakingSubmissions, vocabTotal, masteredVocab } = data;

  const sectionStats = SECTIONS.map((s) => {
    const sectionSessions = sessions.filter((sess) => sess.section === s.key);
    const avgBand = avg(sectionSessions.map((sess) => sess.bandScore));
    const latest = sectionSessions[sectionSessions.length - 1];
    const trend = sectionSessions.length >= 2
      ? (sectionSessions[sectionSessions.length - 1].bandScore || 0) - (sectionSessions[sectionSessions.length - 2].bandScore || 0)
      : null;
    return { ...s, count: sectionSessions.length, avgBand, latestBand: latest?.bandScore || null, trend };
  });

  const overallAvg = avg(sessions.map((s) => s.bandScore));

  // Chart data: band scores over time (last 20 sessions)
  const chartSessions = sessions.filter((s) => s.bandScore).slice(-20);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" /> Progress Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your improvement over time</p>
      </div>

      {/* Overall */}
      {overallAvg && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Overall Average Band</p>
            <p className="text-5xl font-bold text-indigo-600">{overallAvg.toFixed(1)}</p>
          </div>
          <div className="flex-1">
            <BandBar score={overallAvg} />
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>0</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {sessions.length} total sessions
          </div>
        </div>
      )}

      {/* Per section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {sectionStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              {s.avgBand ? (
                <>
                  <p className={cn("text-2xl font-bold mt-1 px-2 py-0.5 rounded inline-block", bandScoreBg(s.avgBand))}>
                    {s.avgBand.toFixed(1)}
                  </p>
                  {s.trend !== null && (
                    <p className={cn("text-xs mt-1", s.trend > 0 ? "text-green-600" : s.trend < 0 ? "text-red-500" : "text-gray-400")}>
                      {s.trend > 0 ? "↑" : s.trend < 0 ? "↓" : "→"} {Math.abs(s.trend).toFixed(1)} last session
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{s.count} sessions</p>
                </>
              ) : (
                <p className="text-lg font-bold text-gray-300 mt-1">—</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Band score timeline */}
      {chartSessions.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Band Score Timeline
          </h2>
          <div className="flex items-end gap-1.5 h-32">
            {chartSessions.map((s) => {
              const h = ((s.bandScore! - 3) / 6) * 100;
              const colors: Record<string, string> = {
                reading: "bg-blue-400", listening: "bg-purple-400",
                writing: "bg-green-400", speaking: "bg-red-400", mock: "bg-orange-400",
              };
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">{s.bandScore?.toFixed(1)}</div>
                  <div
                    className={cn("w-full rounded-t-sm", colors[s.section] || "bg-gray-400")}
                    style={{ height: `${Math.max(h, 5)}%` }}
                    title={`${s.section}: ${s.bandScore}`}
                  />
                  <div className="text-xs text-gray-400 rotate-90 origin-center h-4 overflow-hidden">
                    {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {["reading", "listening", "writing", "speaking", "mock"].map((sec) => (
              <div key={sec} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded-sm", { reading: "bg-blue-400", listening: "bg-purple-400", writing: "bg-green-400", speaking: "bg-red-400", mock: "bg-orange-400" }[sec])} />
                <span className="text-xs text-gray-500 capitalize">{sec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Writing history */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-green-600" /> Writing History
          </h2>
          {writingSubmissions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada writing submission.</p>
          ) : (
            <div className="space-y-2">
              {writingSubmissions.map((w) => (
                <div key={w.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded mr-1.5">{w.taskType === "task1" ? "T1" : "T2"}</span>
                    <span className="text-gray-400 text-xs">{new Date(w.createdAt).toLocaleDateString("id-ID")}</span>
                    {w.wordCount && <span className="text-gray-400 text-xs ml-1">· {w.wordCount}w</span>}
                  </div>
                  {w.bandScore && <span className={cn("text-xs font-bold px-2 py-0.5 rounded", bandScoreBg(w.bandScore))}>Band {w.bandScore.toFixed(1)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Speaking history + Vocab */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-600" /> Speaking History
            </h2>
            {speakingSubmissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada speaking submission.</p>
            ) : (
              <div className="space-y-2">
                {speakingSubmissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded mr-1.5">Part {s.part}</span>
                      <span className="text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                    {s.bandScore && <span className={cn("text-xs font-bold px-2 py-0.5 rounded", bandScoreBg(s.bandScore))}>Band {s.bandScore.toFixed(1)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Vocabulary Progress</h2>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{masteredVocab}</p>
                <p className="text-xs text-gray-500">Mastered</p>
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-yellow-500 transition-all"
                    style={{ width: vocabTotal > 0 ? `${(masteredVocab / vocabTotal) * 100}%` : "0%" }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{masteredVocab} / {vocabTotal} words</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Mulai practice untuk melihat progress di sini!</p>
        </div>
      )}
    </div>
  );
}
