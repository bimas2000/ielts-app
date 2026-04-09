export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import SpeakingClient from "@/components/SpeakingClient";

async function getData() {
  const recent = await prisma.speakingSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, part: true, question: true, bandScore: true, createdAt: true },
  });
  return { recent };
}

export default async function SpeakingPage() {
  const data = await getData();
  return <SpeakingClient data={data} />;
}
