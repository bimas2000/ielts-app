import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { targetBand, examDate } = body;

  const settings = await prisma.userSettings.upsert({
    where: { id: 1 },
    update: {
      targetBand: parseFloat(targetBand),
      examDate: examDate ? new Date(examDate) : null,
    },
    create: {
      id: 1,
      targetBand: parseFloat(targetBand),
      examDate: examDate ? new Date(examDate) : null,
    },
  });

  return NextResponse.json(settings);
}
