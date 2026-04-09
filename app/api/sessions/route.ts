import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { section, score, bandScore, duration, notes } = body;

  const session = await prisma.practiceSession.create({
    data: { section, score, bandScore, duration, notes },
  });

  return NextResponse.json(session);
}

export async function GET() {
  const sessions = await prisma.practiceSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ sessions });
}
