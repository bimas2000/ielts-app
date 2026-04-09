"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CalendarDays, CheckCircle2, Circle, Clock, Target, Flame,
  BookOpen, Headphones, PenLine, Mic, Brain, ClipboardList,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, BarChart3,
} from "lucide-react";
import { FOCUS_COLORS, FOCUS_LABELS, totalDailyMinutes } from "@/lib/studyPlanGenerator";

interface Task {
  id: number;
  planDate: Date;
  section: string;
  taskTitle: string;
  description: string;
  duration: number;
  done: boolean;
  href: string | null;
}

interface PlanDay {
  id: number;
  date: Date;
  weekNumber: number;
  dayOfWeek: number;
  focus: string;
  tasks: string; // JSON
  completed: boolean;
}

interface Props {
  data: {
    settings: { targetBand: number; examDate: Date | null; studyStreak: number };
    tasks: Task[];
    plans: PlanDay[];
    todayTasks: Task[];
    today: string;
  };
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
  vocabulary: Brain,
  mock: ClipboardList,
  review: BarChart3,
};

const SECTION_COLORS: Record<string, string> = {
  reading: "text-blue-600 bg-blue-50",
  listening: "text-purple-600 bg-purple-50",
  writing: "text-green-600 bg-green-50",
  speaking: "text-red-600 bg-red-50",
  vocabulary: "text-yellow-600 bg-yellow-50",
  mock: "text-orange-600 bg-orange-50",
  review: "text-gray-600 bg-gray-100",
};

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function isSameDay(a: Date, b: Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

export default function StudyPlanClient({ data }: Props) {
  const { settings, tasks, plans, today } = data;
  const todayDate = new Date(today);

  const [taskStates, setTaskStates] = useState<Record<number, boolean>>(
    Object.fromEntries(tasks.map((t) => [t.id, t.done]))
  );
  const [generating, setGenerating] = useState(false);
  const [examInput, setExamInput] = useState(
    settings.examDate ? new Date(settings.examDate).toISOString().split("T")[0] : ""
  );
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true });
  const [selectedDay, setSelectedDay] = useState<string>(today.split("T")[0]);

  const examDays = daysUntil(settings.examDate);

  async function generatePlan(regenerate = false) {
    if (!examInput) return;
    setGenerating(true);
    // Save exam date first
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetBand: settings.targetBand, examDate: examInput }),
    });
    // Generate plan
    await fetch("/api/study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examDate: examInput, regenerate }),
    });
    setGenerating(false);
    window.location.reload();
  }

  async function toggleTask(id: number) {
    const newDone = !taskStates[id];
    setTaskStates((p) => ({ ...p, [id]: newDone }));
    await fetch(`/api/study-plan/task/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });
  }

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    const key = new Date(task.planDate).toISOString().split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Group plans by week
  const plansByWeek = plans.reduce((acc, plan) => {
    const wk = plan.weekNumber;
    if (!acc[wk]) acc[wk] = [];
    acc[wk].push(plan);
    return acc;
  }, {} as Record<number, PlanDay[]>);

  const weeks = Object.keys(plansByWeek).map(Number).sort();

  // Today's tasks
  const todayKey = today.split("T")[0];
  const todayTaskList = tasksByDate[todayKey] || [];
  const todayDone = todayTaskList.filter((t) => taskStates[t.id]).length;
  const todayTotal = todayTaskList.length;
  const todayMinutes = todayTaskList.reduce((s, t) => s + t.duration, 0);

  // Selected day tasks
  const selectedTasks = tasksByDate[selectedDay] || [];

  if (plans.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" /> Study Plan
          </h1>
          <p className="text-gray-500 text-sm mt-1">Jadwal belajar harian otomatis menuju ujian IELTS</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Generate Study Plan</h2>
          <p className="text-sm text-gray-500 mb-6">Masukkan tanggal ujian IELTS kamu, dan AI akan membuat jadwal belajar harian otomatis.</p>

          <div className="mb-4 text-left">
            <label className="text-xs font-medium text-gray-500 block mb-1">Tanggal Ujian IELTS</label>
            <input
              type="date"
              value={examInput}
              onChange={(e) => setExamInput(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => generatePlan(false)}
            disabled={generating || !examInput}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Study Plan</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" /> Study Plan
          </h1>
          <p className="text-gray-500 text-sm mt-1">Jadwal belajar harian menuju ujian IELTS</p>
        </div>
        <button
          onClick={() => generatePlan(true)}
          disabled={generating}
          className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
          Regenerate
        </button>
      </div>

      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs text-gray-500 font-medium">Target Band</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{settings.targetBand.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">Ujian</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{examDays !== null ? examDays : "—"}<span className="text-sm font-normal text-gray-400"> hari</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{settings.studyStreak}<span className="text-sm font-normal text-gray-400"> hari</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{todayDone}/{todayTotal}<span className="text-sm font-normal text-gray-400"> tasks</span></p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT: Weekly calendar view */}
        <div className="md:col-span-2 space-y-4">
          {weeks.map((wk) => {
            const weekPlans = plansByWeek[wk];
            const isExpanded = expandedWeeks[wk] ?? false;
            const weekDone = weekPlans.filter((p) =>
              (tasksByDate[new Date(p.date).toISOString().split("T")[0]] || []).every((t) => taskStates[t.id])
            ).length;

            return (
              <div key={wk} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedWeeks((p) => ({ ...p, [wk]: !p[wk] }))}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-800">Minggu {wk}</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(weekPlans[0].date)} – {formatDate(weekPlans[weekPlans.length - 1].date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{weekDone}/{weekPlans.length} hari selesai</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {weekPlans.map((plan) => {
                      const dateKey = new Date(plan.date).toISOString().split("T")[0];
                      const dayTasks = tasksByDate[dateKey] || [];
                      const doneTasks = dayTasks.filter((t) => taskStates[t.id]).length;
                      const isToday = isSameDay(plan.date, todayDate);
                      const isPast = new Date(plan.date) < todayDate && !isToday;
                      const isSelected = dateKey === selectedDay;
                      const totalMins = dayTasks.reduce((s, t) => s + t.duration, 0);

                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedDay(dateKey)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-left transition-colors",
                            isSelected && "bg-indigo-50",
                            isPast && "opacity-60"
                          )}
                        >
                          {/* Day indicator */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-center",
                            isToday ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                          )}>
                            <span className="text-xs font-medium leading-none">{DAY_NAMES[(plan.dayOfWeek - 1) % 7]}</span>
                            <span className="text-sm font-bold leading-none mt-0.5">{new Date(plan.date).getDate()}</span>
                          </div>

                          {/* Focus badge */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {isToday && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Hari ini</span>}
                              <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", FOCUS_COLORS[plan.focus])}>
                                {FOCUS_LABELS[plan.focus]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{totalMins} menit</span>
                              <span>·</span>
                              <span>{dayTasks.length} tasks</span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="shrink-0 text-right">
                            {dayTasks.length > 0 && (
                              <>
                                <p className={cn("text-sm font-bold", doneTasks === dayTasks.length ? "text-green-600" : "text-gray-500")}>
                                  {doneTasks}/{dayTasks.length}
                                </p>
                                {doneTasks === dayTasks.length && <span className="text-xs text-green-500">✓ Done</span>}
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Selected day detail */}
        <div className="space-y-4">
          {/* Selected day tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {isSameDay(new Date(selectedDay), todayDate) ? "Hari Ini" : formatDate(new Date(selectedDay))}
                </p>
                {selectedTasks.length > 0 && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedTasks.reduce((s, t) => s + t.duration, 0)} menit total
                  </p>
                )}
              </div>
              {selectedTasks.length > 0 && (
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600">
                    {selectedTasks.filter((t) => taskStates[t.id]).length}/{selectedTasks.length}
                  </p>
                  <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${(selectedTasks.filter((t) => taskStates[t.id]).length / selectedTasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {selectedTasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Tidak ada jadwal untuk hari ini.</p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task) => {
                  const Icon = SECTION_ICONS[task.section] || Circle;
                  const done = taskStates[task.id];
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex gap-2.5 p-3 rounded-lg border transition-colors",
                        done ? "border-green-100 bg-green-50" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <button onClick={() => toggleTask(task.id)} className="shrink-0 mt-0.5">
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : <Circle className="w-4 h-4 text-gray-300" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0", SECTION_COLORS[task.section])}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <p className={cn("text-sm font-medium", done && "line-through text-gray-400")}>
                            {task.taskTitle}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{task.duration} min
                          </span>
                          {task.href && (
                            <Link href={task.href} className="text-xs text-indigo-600 hover:underline">
                              Mulai →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exam countdown */}
          {settings.examDate && (
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white">
              <p className="text-xs font-medium opacity-80 mb-1">Ujian IELTS</p>
              <p className="text-3xl font-bold">{examDays}</p>
              <p className="text-sm opacity-80">hari lagi</p>
              <p className="text-xs opacity-60 mt-2">
                {new Date(settings.examDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs opacity-70 mb-1">
                  <span>Progress Persiapan</span>
                  <span>{plans.filter((p) =>
                    (tasksByDate[new Date(p.date).toISOString().split("T")[0]] || []).every((t) => taskStates[t.id])
                  ).length}/{plans.length} hari</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-white transition-all"
                    style={{
                      width: `${plans.length > 0 ? (plans.filter((p) =>
                        (tasksByDate[new Date(p.date).toISOString().split("T")[0]] || []).every((t) => taskStates[t.id])
                      ).length / plans.length) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Change exam date */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Ubah Tanggal Ujian</p>
            <input
              type="date"
              value={examInput}
              onChange={(e) => setExamInput(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            <button
              onClick={() => generatePlan(true)}
              disabled={generating || !examInput}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
              Update & Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
