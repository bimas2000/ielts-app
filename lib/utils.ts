import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bandScoreColor(score: number): string {
  if (score >= 8) return "text-green-500";
  if (score >= 7) return "text-blue-500";
  if (score >= 6) return "text-yellow-500";
  if (score >= 5) return "text-orange-500";
  return "text-red-500";
}

export function bandScoreBg(score: number): string {
  if (score >= 8) return "bg-green-100 text-green-800";
  if (score >= 7) return "bg-blue-100 text-blue-800";
  if (score >= 6) return "bg-yellow-100 text-yellow-800";
  if (score >= 5) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}
