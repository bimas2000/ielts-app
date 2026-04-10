"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bot, X, Send, ChevronDown, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  "/reading": ["Cara skim & scan yang efektif?", "Tips untuk True/False/Not Given?", "Cara manage waktu 60 menit?"],
  "/listening": ["Cara predict answers sebelum audio?", "Tips untuk section 3 & 4?", "Apa itu distractors?"],
  "/writing": ["Struktur Writing Task 2 yang bagus?", "Cara tulis overview Task 1?", "Tips dapat band 7+ writing?"],
  "/speaking": ["Cara extend jawaban Part 1?", "Tips untuk Part 2 long turn?", "Phrase untuk express opinion?"],
  "/vocabulary": ["Tips hafal vocabulary IELTS?", "Perbedaan formal & informal?", "Cara paraphrase yang baik?"],
  default: ["Apa itu IELTS band score?", "Bagaimana cara study plan yang efektif?", "Tips dapat band 7 overall?"],
};

function getContext(pathname: string): string {
  if (pathname.includes("reading")) return "Reading";
  if (pathname.includes("listening")) return "Listening";
  if (pathname.includes("writing")) return "Writing";
  if (pathname.includes("speaking")) return "Speaking";
  if (pathname.includes("vocabulary")) return "Vocabulary";
  if (pathname.includes("study-plan")) return "Study Plan";
  if (pathname.includes("mock-test")) return "Mock Test";
  return "Dashboard";
}

export default function AiTutor() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const context = getContext(pathname);
  const suggestions = SUGGESTIONS[pathname] ?? SUGGESTIONS.default;

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Greeting when first opened
  useEffect(() => {
    if (open && messages.length === 0) {
      const greetings: Record<string, string> = {
        Reading: "Halo! Lagi practice Reading nih? 📖 Ada yang mau ditanyain soal tips reading, strategi, atau soal yang bikin bingung?",
        Listening: "Halo! Siap latihan Listening! 🎧 Mau tanya strategi, atau ada bagian yang susah dimengerti?",
        Writing: "Halo! Writing time! ✍️ Mau tanya soal struktur essay, cara tulis overview, atau tips dapat band tinggi?",
        Speaking: "Halo! Speaking practice! 🎤 Mau tanya cara extend jawaban, tips Part 2, atau phrase yang bagus?",
        default: "Halo! Aku IELTS Pro Tutor! 🎯 Mau tanya apa? Strategi belajar, tips section tertentu, atau cara dapat band target kamu?",
      };
      const greeting = greetings[context] ?? greetings.default;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      const json = await res.json();
      const reply = json.reply ?? "Maaf, ada error. Coba lagi ya!";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (!open) setUnread((u) => u + 1);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, koneksi bermasalah. Coba lagi!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "min(480px, 70vh)" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">IELTS Tutor AI</p>
                <p className="text-blue-200 text-xs">{context} section • Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-1.5 mt-0.5 shrink-0">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
                <div className={cn(
                  "rounded-2xl px-3 py-2 text-sm max-w-[85%] leading-relaxed",
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                )}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-1.5 mt-0.5 shrink-0">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-1 flex flex-wrap gap-1.5 shrink-0">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-2.5 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Tanya apapun tentang IELTS..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white rounded-xl px-3 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-4 right-4 md:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          open
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        )}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <Sparkles className="w-6 h-6 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
