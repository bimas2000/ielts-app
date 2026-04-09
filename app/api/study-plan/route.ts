import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStudyPlan } from "@/lib/studyPlanGenerator";

// GET — ambil semua daily tasks dari DB (untuk range tertentu)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = from && to ? {
    planDate: {
      gte: new Date(from),
      lte: new Date(to),
    },
  } : {};

  const tasks = await prisma.dailyTask.findMany({
    where,
    orderBy: [{ planDate: "asc" }, { section: "asc" }],
  });

  return NextResponse.json({ tasks });
}

// POST — generate study plan berdasarkan exam date
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { examDate, regenerate } = body;

  if (!examDate) {
    return NextResponse.json({ error: "examDate required" }, { status: 400 });
  }

  const exam = new Date(examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (exam <= today) {
    return NextResponse.json({ error: "Exam date must be in the future" }, { status: 400 });
  }

  // If regenerate, delete existing future tasks
  if (regenerate) {
    await prisma.dailyTask.deleteMany({
      where: { planDate: { gte: today } },
    });
  }

  // Check if plan already exists
  const existing = await prisma.dailyTask.count({
    where: { planDate: { gte: today } },
  });

  if (existing > 0 && !regenerate) {
    return NextResponse.json({ message: "Plan already exists", count: existing });
  }

  // Generate plan
  const plans = generateStudyPlan(exam, today);

  // Save to DB
  const tasksToCreate = plans.flatMap((day) =>
    day.tasks.map((task) => ({
      planDate: day.date,
      section: task.section,
      taskTitle: task.taskTitle,
      description: task.description,
      duration: task.duration,
      href: task.href,
      done: false,
    }))
  );

  await prisma.dailyTask.createMany({ data: tasksToCreate });

  // Also save/update study plan summaries
  await prisma.studyPlan.deleteMany({ where: { date: { gte: today } } });
  await prisma.studyPlan.createMany({
    data: plans.map((day) => ({
      weekNumber: day.weekNumber,
      dayOfWeek: day.dayOfWeek,
      date: day.date,
      tasks: JSON.stringify(day.tasks.map((t) => t.taskTitle)),
      focus: day.focus,
    })),
  });

  return NextResponse.json({ success: true, daysGenerated: plans.length, tasksCreated: tasksToCreate.length });
}
