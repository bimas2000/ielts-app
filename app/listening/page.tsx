export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ListeningClient from "@/components/ListeningClient";

async function getQuestions() {
  const questions = await prisma.question.findMany({
    where: { section: "listening" },
    orderBy: [{ partNumber: "asc" }, { createdAt: "asc" }],
  });
  return questions;
}

export default async function ListeningPage() {
  const questions = await getQuestions();
  return <ListeningClient questions={questions} />;
}
