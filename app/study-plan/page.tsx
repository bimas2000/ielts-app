export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import StudyPlanClient from "@/components/StudyPlanClient";

async function getData() {
  const settings = await prisma.userSettings.findUnique({ where: { id: 1 } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in21Days = new Date(today);
  in21Days.setDate(today.getDate() + 21);

  // Get tasks for next 21 days
  const tasks = await prisma.dailyTask.findMany({
    where: {
      planDate: { gte: today, lte: in21Days },
    },
    orderBy: [{ planDate: "asc" }, { id: "asc" }],
  });

  // Get study plan summaries
  const plans = await prisma.studyPlan.findMany({
    where: { date: { gte: today, lte: in21Days } },
    orderBy: { date: "asc" },
  });

  // Count completed tasks today
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTasks = tasks.filter(
    (t) => new Date(t.planDate) >= today && new Date(t.planDate) <= todayEnd
  );

  return {
    settings: settings ?? { targetBand: 7.0, examDate: null, studyStreak: 0 },
    tasks,
    plans,
    todayTasks,
    today: today.toISOString(),
  };
}

export default async function StudyPlanPage() {
  const data = await getData();
  return <StudyPlanClient data={data} />;
}
