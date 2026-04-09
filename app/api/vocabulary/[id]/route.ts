import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const word = await prisma.vocabularyWord.update({
    where: { id: parseInt(id) },
    data: {
      mastered: body.mastered,
      reviewCount: { increment: 1 },
      lastReview: new Date(),
    },
  });

  return NextResponse.json(word);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vocabularyWord.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
