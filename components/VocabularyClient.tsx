"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Brain, Plus, Check, Trash2, Search, Sparkles } from "lucide-react";

interface Word {
  id: number;
  word: string;
  definition: string;
  example: string | null;
  topic: string | null;
  mastered: boolean;
  reviewCount: number;
}

interface Props {
  data: { words: Word[]; topics: string[] };
}

const IELTS_TOPICS = [
  "Environment", "Technology", "Education", "Health", "Society",
  "Economy", "Culture", "Politics", "Science", "Urban Development",
  "Food & Nutrition", "Media", "Travel", "Work & Employment", "Crime & Justice",
];

export default function VocabularyClient({ data }: Props) {
  const [words, setWords] = useState<Word[]>(data.words);
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "learning">("all");
  const [flashcard, setFlashcard] = useState<Word | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedTopic, setSelectedTopicFilter] = useState<string>("all");

  const allTopics = [...new Set([...data.topics, ...words.map((w) => w.topic).filter(Boolean)])].filter(Boolean) as string[];

  async function generateWords() {
    const t = customTopic || topic;
    if (!t) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vocabulary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t, count }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      window.location.reload();
    } catch {
      setError("Gagal generate.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleMastered(word: Word) {
    const res = await fetch(`/api/vocabulary/${word.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mastered: !word.mastered }),
    });
    const updated = await res.json();
    setWords((prev) => prev.map((w) => w.id === updated.id ? updated : w));
  }

  async function deleteWord(id: number) {
    await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  const filtered = words.filter((w) => {
    const matchSearch = !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.definition.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "mastered" ? w.mastered : !w.mastered);
    const matchTopic = selectedTopic === "all" || w.topic === selectedTopic;
    return matchSearch && matchFilter && matchTopic;
  });

  const masteredCount = words.filter((w) => w.mastered).length;

  // Flashcard mode
  if (flashcard) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-yellow-600" /> Flashcard Mode
          </h1>
          <button onClick={() => setFlashcard(null)} className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Exit</button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center min-h-64 flex flex-col items-center justify-center cursor-pointer" onClick={() => setShowAnswer(!showAnswer)}>
          <p className="text-3xl font-bold text-gray-900 mb-4">{flashcard.word}</p>
          {flashcard.topic && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mb-4">{flashcard.topic}</span>}
          {showAnswer ? (
            <div className="mt-4 text-left w-full">
              <p className="text-gray-700 mb-3">{flashcard.definition}</p>
              {flashcard.example && <p className="text-sm text-gray-500 italic">"{flashcard.example}"</p>}
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-2">Tap to reveal definition</p>
          )}
        </div>
        {showAnswer && (
          <div className="flex gap-3 mt-4 justify-center">
            <button onClick={() => { toggleMastered(flashcard); const next = filtered.find((w) => w.id !== flashcard.id && !w.mastered); setFlashcard(next || null); setShowAnswer(false); }} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700">
              <Check className="w-4 h-4 inline mr-1" /> Mastered
            </button>
            <button onClick={() => { const idx = filtered.findIndex((w) => w.id === flashcard.id); const next = filtered[(idx + 1) % filtered.length]; setFlashcard(next); setShowAnswer(false); }} className="border border-gray-200 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50">
              Next →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-yellow-600" /> Vocabulary Builder
        </h1>
        <p className="text-gray-500 text-sm mt-1">{masteredCount}/{words.length} mastered</p>
      </div>

      {/* Generate */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-800">Generate AI Vocabulary</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-2">
          {IELTS_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors", topic === t ? "bg-yellow-600 text-white" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200")}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Or type custom topic..."
            value={customTopic}
            onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }}
            className="flex-1 border border-yellow-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <select value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="border border-yellow-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none">
            {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} words</option>)}
          </select>
          <button
            onClick={generateWords}
            disabled={loading || (!topic && !customTopic)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate
          </button>
        </div>
        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
      </div>

      {words.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-40"
              />
            </div>
            {(["all", "learning", "mastered"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", filter === f ? "bg-gray-800 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {allTopics.length > 0 && (
              <select value={selectedTopic} onChange={(e) => setSelectedTopicFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                <option value="all">All Topics</option>
                {allTopics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            {filtered.filter((w) => !w.mastered).length > 0 && (
              <button
                onClick={() => { const notMastered = filtered.filter((w) => !w.mastered); setFlashcard(notMastered[0]); setShowAnswer(false); }}
                className="ml-auto bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-700 flex items-center gap-1.5"
              >
                <Brain className="w-3.5 h-3.5" /> Flashcard ({filtered.filter((w) => !w.mastered).length})
              </button>
            )}
          </div>

          {/* Word list */}
          <div className="space-y-2">
            {filtered.map((word) => (
              <div key={word.id} className={cn("bg-white rounded-xl border p-4 flex gap-3", word.mastered ? "border-green-200 opacity-70" : "border-gray-200")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("font-bold text-gray-900", word.mastered && "line-through text-gray-400")}>{word.word}</span>
                    {word.topic && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">{word.topic}</span>}
                    {word.mastered && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Mastered</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{word.definition}</p>
                  {word.example && <p className="text-xs text-gray-400 italic">"{word.example}"</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => toggleMastered(word)} className={cn("p-1.5 rounded-lg border transition-colors", word.mastered ? "border-gray-200 text-gray-400 hover:bg-gray-50" : "border-green-200 text-green-600 hover:bg-green-50")}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteWord(word.id)} className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">Tidak ada kata yang cocok.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
