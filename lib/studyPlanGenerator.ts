// ============================================================
// IELTS Study Plan Generator
// Generates a structured daily study plan based on exam date
// ============================================================

export interface DailyTaskDef {
  section: string;
  taskTitle: string;
  description: string;
  duration: number; // minutes
  href: string;
}

export interface DayPlan {
  date: Date;
  weekNumber: number;
  dayOfWeek: number;
  focus: string;
  tasks: DailyTaskDef[];
}

// ------- Task templates -------
const READING_TASKS: DailyTaskDef[] = [
  { section: "reading", taskTitle: "Reading Practice", description: "Kerjakan 1 set soal reading (6 soal). Gunakan strategi skim-scan.", duration: 20, href: "/reading" },
  { section: "reading", taskTitle: "True/False/Not Given", description: "Fokus latihan soal T/F/NG — tipe soal yang paling sering menjebak.", duration: 15, href: "/reading" },
  { section: "reading", taskTitle: "Matching Headings", description: "Latihan strategi matching headings: baca kalimat pertama tiap paragraf.", duration: 20, href: "/reading" },
];
const LISTENING_TASKS: DailyTaskDef[] = [
  { section: "listening", taskTitle: "Listening Part 1 & 2", description: "Latihan part 1 (everyday conversation) dan part 2 (monologue). Fokus angka, nama, tempat.", duration: 20, href: "/listening" },
  { section: "listening", taskTitle: "Listening Part 3 & 4", description: "Latihan part 3 (diskusi akademik) dan part 4 (kuliah). Level paling sulit.", duration: 25, href: "/listening" },
];
const WRITING_T1_TASKS: DailyTaskDef[] = [
  { section: "writing", taskTitle: "Writing Task 1 (20 min)", description: "Tulis response Task 1 dengan timer. Wajib ada overview di paragraf kedua.", duration: 25, href: "/writing" },
];
const WRITING_T2_TASKS: DailyTaskDef[] = [
  { section: "writing", taskTitle: "Writing Task 2 (40 min)", description: "Tulis essay Task 2 penuh dengan timer. Target 280-320 kata dengan struktur jelas.", duration: 45, href: "/writing" },
];
const SPEAKING_TASKS: DailyTaskDef[] = [
  { section: "speaking", taskTitle: "Speaking Part 1 Practice", description: "Jawab 5 pertanyaan Part 1. Record dan minta AI feedback.", duration: 15, href: "/speaking" },
  { section: "speaking", taskTitle: "Speaking Part 2 (Cue Card)", description: "Prepare 1 menit, bicara 2 menit. Fokus coherence dan vocabulary.", duration: 20, href: "/speaking" },
  { section: "speaking", taskTitle: "Speaking Part 3 Practice", description: "Diskusi topik abstrak. Latih ekspresi pendapat: 'I strongly believe...', 'On the contrary...'", duration: 15, href: "/speaking" },
];
const VOCAB_TASKS: DailyTaskDef[] = [
  { section: "vocabulary", taskTitle: "Vocabulary: Generate 10 Kata", description: "Generate vocabulary AI untuk 1 topik IELTS. Review dan hafal dengan flashcard.", duration: 15, href: "/vocabulary" },
  { section: "vocabulary", taskTitle: "Vocabulary Review", description: "Flashcard review semua kata yang belum mastered. Target minimal 5 kata baru.", duration: 10, href: "/vocabulary" },
];
const REVIEW_TASKS: DailyTaskDef[] = [
  { section: "review", taskTitle: "Review Feedback AI", description: "Baca ulang feedback writing/speaking sebelumnya. Catat pola kesalahan yang berulang.", duration: 15, href: "/progress" },
  { section: "review", taskTitle: "Progress Check", description: "Cek grafik progress, bandingkan band score minggu ini vs minggu lalu.", duration: 10, href: "/progress" },
];
const MOCK_TASKS: DailyTaskDef[] = [
  { section: "mock", taskTitle: "Full Mock Test", description: "Kerjakan semua 4 section dengan kondisi ujian nyata. Jangan pause, jangan cek jawaban.", duration: 180, href: "/mock-test" },
];

// ------- Day type schedules -------
type DayType = "reading_vocab" | "listening_vocab" | "writing_t1" | "writing_t2" | "speaking" | "mixed" | "mock" | "review_rest";

const DAY_SCHEDULES: Record<DayType, { focus: string; tasks: DailyTaskDef[] }> = {
  reading_vocab: {
    focus: "reading",
    tasks: [...READING_TASKS.slice(0, 2), VOCAB_TASKS[0]],
  },
  listening_vocab: {
    focus: "listening",
    tasks: [...LISTENING_TASKS, VOCAB_TASKS[1]],
  },
  writing_t1: {
    focus: "writing",
    tasks: [...WRITING_T1_TASKS, VOCAB_TASKS[1], REVIEW_TASKS[0]],
  },
  writing_t2: {
    focus: "writing",
    tasks: [...WRITING_T2_TASKS, REVIEW_TASKS[0]],
  },
  speaking: {
    focus: "speaking",
    tasks: [...SPEAKING_TASKS, VOCAB_TASKS[1]],
  },
  mixed: {
    focus: "mixed",
    tasks: [READING_TASKS[0], LISTENING_TASKS[0], SPEAKING_TASKS[0], VOCAB_TASKS[0]],
  },
  mock: {
    focus: "mock",
    tasks: MOCK_TASKS,
  },
  review_rest: {
    focus: "rest",
    tasks: [...REVIEW_TASKS],
  },
};

// Weekly rotation patterns based on weeks until exam
function getWeekPattern(weeksLeft: number): DayType[] {
  // 7-element array (Mon-Sun)
  if (weeksLeft <= 1) {
    // Final week: intensive + rest
    return ["mixed", "writing_t2", "speaking", "mock", "reading_vocab", "listening_vocab", "review_rest"];
  }
  if (weeksLeft <= 2) {
    // 2 weeks: mock test week
    return ["writing_t2", "speaking", "reading_vocab", "mock", "listening_vocab", "writing_t1", "review_rest"];
  }
  if (weeksLeft <= 4) {
    // 1 month: focused practice
    return ["reading_vocab", "writing_t2", "listening_vocab", "speaking", "writing_t1", "mixed", "review_rest"];
  }
  // Standard rotation
  return ["reading_vocab", "listening_vocab", "writing_t1", "speaking", "writing_t2", "mixed", "review_rest"];
}

export function generateStudyPlan(examDate: Date, startDate: Date = new Date()): DayPlan[] {
  const plans: DayPlan[] = [];
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysToGenerate = Math.min(totalDays, 21); // max 3 weeks ahead

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const daysLeft = Math.ceil((exam.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.ceil(daysLeft / 7);
    const weekNumber = Math.floor(i / 7) + 1;

    // Day of week: 0=Sun, 1=Mon, ... 6=Sat → convert to 1=Mon, 7=Sun
    const jsDay = date.getDay(); // 0=Sun
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1=Mon, 7=Sun

    const pattern = getWeekPattern(weeksLeft);
    const dayType = pattern[dayOfWeek - 1]; // Mon=idx0, Sun=idx6
    const schedule = DAY_SCHEDULES[dayType];

    plans.push({
      date,
      weekNumber,
      dayOfWeek,
      focus: schedule.focus,
      tasks: schedule.tasks,
    });
  }

  return plans;
}

export function totalDailyMinutes(tasks: DailyTaskDef[]): number {
  return tasks.reduce((sum, t) => sum + t.duration, 0);
}

export const FOCUS_LABELS: Record<string, string> = {
  reading: "Reading Focus",
  listening: "Listening Focus",
  writing: "Writing Focus",
  speaking: "Speaking Focus",
  mixed: "Mixed Practice",
  mock: "Mock Test Day",
  rest: "Review & Rest",
};

export const FOCUS_COLORS: Record<string, string> = {
  reading: "bg-blue-100 text-blue-800 border-blue-200",
  listening: "bg-purple-100 text-purple-800 border-purple-200",
  writing: "bg-green-100 text-green-800 border-green-200",
  speaking: "bg-red-100 text-red-800 border-red-200",
  mixed: "bg-indigo-100 text-indigo-800 border-indigo-200",
  mock: "bg-orange-100 text-orange-800 border-orange-200",
  rest: "bg-gray-100 text-gray-600 border-gray-200",
};
