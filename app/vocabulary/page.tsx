export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import VocabularyClient from "@/components/VocabularyClient";

async function getData() {
  const words = await prisma.vocabularyWord.findMany({
    orderBy: [{ mastered: "asc" }, { createdAt: "desc" }],
  });
  const topics = [...new Set(words.map((w) => w.topic).filter(Boolean))] as string[];
  return { words, topics };
}

export default async function VocabularyPage() {
  const data = await getData();
  return <VocabularyClient data={data} />;
}
