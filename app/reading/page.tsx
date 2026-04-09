export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ReadingClient from "@/components/ReadingClient";

async function getQuestions() {
  const questions = await prisma.question.findMany({
    where: { section: "reading" },
    orderBy: { createdAt: "asc" },
  });
  return questions;
}

export default async function ReadingPage() {
  const questions = await getQuestions();
  return <ReadingClient questions={questions} />;
}
