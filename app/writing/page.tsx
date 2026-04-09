export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import WritingClient from "@/components/WritingClient";

async function getData() {
  const prompts = await prisma.writingPrompt.findMany({
    orderBy: { createdAt: "desc" },
  });
  const recentSubmissions = await prisma.writingSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, taskType: true, bandScore: true, wordCount: true, createdAt: true, prompt: true },
  });
  return { prompts, recentSubmissions };
}

export default async function WritingPage() {
  const data = await getData();
  return <WritingClient data={data} />;
}
