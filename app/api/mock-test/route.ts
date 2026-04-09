import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { readingScore, listeningScore, writingScore, speakingScore, totalScore } = body;

  const test = await prisma.mockTest.create({
    data: {
      readingScore: readingScore || null,
      listeningScore: listeningScore || null,
      writingScore: writingScore || null,
      speakingScore: speakingScore || null,
      totalScore: totalScore || null,
      completed: true,
    },
  });

  // Also log in sessions for progress chart
  if (totalScore) {
    await prisma.practiceSession.create({
      data: { section: "mock", bandScore: totalScore },
    });
  }

  return NextResponse.json(test);
}
