export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ProgressClient from "@/components/ProgressClient";

async function getData() {
  const sessions = await prisma.practiceSession.findMany({
    orderBy: { createdAt: "asc" },
  });

  const writingSubmissions = await prisma.writingSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, taskType: true, bandScore: true, wordCount: true, createdAt: true },
  });

  const speakingSubmissions = await prisma.speakingSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, part: true, bandScore: true, createdAt: true },
  });

  const vocabStats = await prisma.vocabularyWord.aggregate({
    _count: { id: true },
    where: {},
  });
  const masteredVocab = await prisma.vocabularyWord.count({ where: { mastered: true } });

  return { sessions, writingSubmissions, speakingSubmissions, vocabTotal: vocabStats._count.id, masteredVocab };
}

export default async function ProgressPage() {
  const data = await getData();
  return <ProgressClient data={data} />;
}
