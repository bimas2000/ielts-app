"use client";

import Link from "next/link";
import { useState } from "react";
import { bandScoreColor, bandScoreBg, cn } from "@/lib/utils";
import {
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Brain,
  ClipboardList,
  TrendingUp,
  Flame,
  Calendar,
  Target,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

interface DailyTask {
  id: number;
  section: string;
  taskTitle: string;
  description: string;
  duration: number;
  done: boolean;
  href: string | null;
}

interface Props {
  data: {
    settings: {
      targetBand: number;
      examDate: Date | null;
      currentBand: number;
      studyStreak: number;
    };
    recentSessions: {
      id: number;
      section: string;
      bandScore: number | null;
      createdAt: Date;
    }[];
    sessionsBySection: {
      section: string;
      _count: { id: number };
      _avg: { bandScore: number | null };
    }[];
    totalSessions: number;
    writingCount: number;
    speakingCount: number;
    vocabCount: number;
    masteredVocab: number;
    todayTasks: DailyTask[];
  };
}

const SECTION_COLORS: Record<string, string> = {
  reading: "text-blue-600",
  listening: "text-purple-600",
  writing: "text-green-600",
  speaking: "text-red-600",
  vocabulary: "text-yellow-600",
  mock: "text-orange-600",
  review: "text-gray-500",
};

const sectionLinks = [
  {
    href: "/reading",
    label: "Reading",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    desc: "Practice passages & questions",
  },
  {
    href: "/listening",
    label: "Listening",
    icon: Headphones,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    desc: "Audio exercises with tips",
  },
  {
    href: "/writing",
    label: "Writing",
    icon: PenLine,
    color: "bg-green-50 text-green-600 border-green-200",
    desc: "AI writing checker & feedback",
  },
  {
    href: "/speaking",
    label: "Speaking",
    icon: Mic,
    color: "bg-red-50 text-red-600 border-red-200",
    desc: "Record & get AI feedback",
  },
  {
    href: "/vocabulary",
    label: "Vocabulary",
    icon: Brain,
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
    desc: "AI-powered word builder",
  },
  {
    href: "/mock-test",
    label: "Mock Test",
    icon: ClipboardList,
    color: "bg-orange-50 text-orange-600 border-orange-200",
    desc: "Full timed simulation",
  },
];

const sectionLabels: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
  mock: "Mock Test",
};

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DashboardClient({ data }: Props) {
  const { settings, recentSessions, sessionsBySection, totalSessions, writingCount, speakingCount, vocabCount, masteredVocab, todayTasks } = data;
  const [taskDone, setTaskDone] = useState<Record<number, boolean>>(
    Object.fromEntries(todayTasks.map((t) => [t.id, t.done]))
  );

  async function toggleTask(id: number) {
    const newDone = !taskDone[id];
    setTaskDone((p) => ({ ...p, [id]: newDone }));
    await fetch(`/api/study-plan/task/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });
  }

  const todayDone = todayTasks.filter((t) => taskDone[t.id]).length;
  const examDays = daysUntil(settings.examDate);

  const [targetInput, setTargetInput] = useState(settings.targetBand.toString());
  const [examInput, setExamInput] = useState(
    settings.examDate ? new Date(settings.examDate).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetBand: parseFloat(targetInput), examDate: examInput || null }),
    });
    setSaving(false);
    window.location.reload();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Track your IELTS preparation progress</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Target Band</span>
          </div>
          <p className={cn("text-3xl font-bold", bandScoreColor(settings.targetBand))}>
            {settings.targetBand.toFixed(1)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Current Est.</span>
          </div>
          <p className={cn("text-3xl font-bold", bandScoreColor(settings.currentBand))}>
            {settings.currentBand > 0 ? settings.currentBand.toFixed(1) : "—"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">Study Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{settings.studyStreak} <span className="text-sm font-normal text-gray-400">days</span></p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Exam Countdown</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {examDays !== null ? examDays : "—"}
            {examDays !== null && <span className="text-sm font-normal text-gray-400"> days</span>}
          </p>
        </div>
      </div>

      {/* Activity stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          <p className="text-xs text-gray-500">Practice Sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{writingCount}</p>
          <p className="text-xs text-gray-500">Writing Checked</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{speakingCount}</p>
          <p className="text-xs text-gray-500">Speaking Recorded</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{masteredVocab}/{vocabCount}</p>
          <p className="text-xs text-gray-500">Vocab Mastered</p>
        </div>
      </div>

      {/* Quick access */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Start</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sectionLinks.map((item) => {
            const Icon = item.icon;
            const stat = sessionsBySection.find((s) => s.section === item.label.toLowerCase());
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border bg-white hover:shadow-md transition-shadow",
                  "group"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", item.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                  {stat && stat._avg.bandScore && (
                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded mt-1 inline-block", bandScoreBg(stat._avg.bandScore))}>
                      avg {stat._avg.bandScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's Study Plan widget */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" /> Jadwal Hari Ini
          </h2>
          <Link href="/study-plan" className="text-xs text-indigo-600 hover:underline">Lihat semua →</Link>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Belum ada jadwal belajar hari ini.</p>
              <p className="text-xs text-gray-400 mt-0.5">Set tanggal ujian dan generate study plan otomatis.</p>
            </div>
            <Link href="/study-plan"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 shrink-0"
            >
              <CalendarDays className="w-3.5 h-3.5" /> Buat Plan
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-100 rounded-full h-2 w-32">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${(todayDone / todayTasks.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{todayDone}/{todayTasks.length} selesai</span>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {todayTasks.reduce((s, t) => s + t.duration, 0)} menit
              </span>
            </div>
            <div className="space-y-1.5">
              {todayTasks.map((task) => {
                const done = taskDone[task.id];
                return (
                  <div key={task.id} className={cn("flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors", done && "opacity-60")}>
                    <button onClick={() => toggleTask(task.id)} className="shrink-0">
                      {done
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Circle className="w-4 h-4 text-gray-300" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium text-gray-800", done && "line-through text-gray-400")}>
                        {task.taskTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs font-medium", SECTION_COLORS[task.section])}>{task.section}</span>
                      <span className="text-xs text-gray-400">{task.duration}m</span>
                      {task.href && !done && (
                        <Link href={task.href} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-100">
                          Mulai
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No sessions yet. Start practicing!</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{sectionLabels[s.section] || s.section}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {s.bandScore && (
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded", bandScoreBg(s.bandScore))}>
                      Band {s.bandScore.toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Target Band Score</label>
              <input
                type="number"
                min="4"
                max="9"
                step="0.5"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Exam Date</label>
              <input
                type="date"
                value={examInput}
                onChange={(e) => setExamInput(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                suppressHydrationWarning
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
