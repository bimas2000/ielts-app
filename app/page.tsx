export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

async function getData() {
  // Ensure settings exist
  let settings = await prisma.userSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { id: 1, targetBand: 7.0 },
    });
  }

  // Recent sessions (last 10)
  const recentSessions = await prisma.practiceSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Section stats
  const sessionsBySection = await prisma.practiceSession.groupBy({
    by: ["section"],
    _count: { id: true },
    _avg: { bandScore: true },
  });

  // Total sessions
  const totalSessions = await prisma.practiceSession.count();

  // Writing submissions count
  const writingCount = await prisma.writingSubmission.count();

  // Speaking submissions count
  const speakingCount = await prisma.speakingSubmission.count();

  // Vocabulary count
  const vocabCount = await prisma.vocabularyWord.count();
  const masteredVocab = await prisma.vocabularyWord.count({
    where: { mastered: true },
  });

  // Today's study plan tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTasks = await prisma.dailyTask.findMany({
    where: { planDate: { gte: today, lte: todayEnd } },
    orderBy: { id: "asc" },
  });

  return {
    settings,
    recentSessions,
    sessionsBySection,
    totalSessions,
    writingCount,
    speakingCount,
    vocabCount,
    masteredVocab,
    todayTasks,
  };
}

export default async function DashboardPage() {
  const data = await getData();
  return <DashboardClient data={data} />;
}
