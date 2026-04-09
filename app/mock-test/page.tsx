export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import MockTestClient from "@/components/MockTestClient";

async function getData() {
  const mockTests = await prisma.mockTest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const settings = await prisma.userSettings.findUnique({ where: { id: 1 } });
  return { mockTests, targetBand: settings?.targetBand || 7.0 };
}

export default async function MockTestPage() {
  const data = await getData();
  return <MockTestClient data={data} />;
}
