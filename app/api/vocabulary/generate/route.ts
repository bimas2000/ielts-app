import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, count = 10 } = body;

    // Vocabulary uses Claude — best quality IELTS academic words
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Generate ${count} IELTS Academic vocabulary words for the topic: "${topic}".

For each word provide: the word, definition (clear and concise), and one example sentence showing IELTS-level academic usage.

Respond ONLY in valid JSON format:
{
  "words": [
    {"word": "string", "definition": "string", "example": "string"}
  ]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "AI error" }, { status: 500 });
    }

    let parsed;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }

    if (!parsed?.words) {
      return NextResponse.json({ error: "No words returned" }, { status: 500 });
    }

    const created = await prisma.vocabularyWord.createMany({
      data: parsed.words.map((w: { word: string; definition: string; example: string }) => ({
        word: w.word,
        definition: w.definition,
        example: w.example,
        topic,
      })),
    });

    return NextResponse.json({ words: parsed.words, count: created.count, aiModel: "claude-sonnet-4-6" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const words = await prisma.vocabularyWord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ words });
}
