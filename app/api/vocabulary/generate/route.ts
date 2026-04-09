import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { topic, count = 10 } = body;

  // Vocabulary uses Gemini — free tier (1500 req/day), great for word generation
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate ${count} IELTS Academic vocabulary words for the topic: "${topic}".

For each word provide: the word, definition (clear and concise), and one example sentence showing IELTS-level academic usage.

Respond ONLY in valid JSON format, no extra text:
{
  "words": [
    {"word": "string", "definition": "string", "example": "string"}
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }

  if (!parsed?.words) {
    return NextResponse.json({ error: "No words returned" }, { status: 500 });
  }

  // Save to database
  const created = await prisma.vocabularyWord.createMany({
    data: parsed.words.map((w: { word: string; definition: string; example: string }) => ({
      word: w.word,
      definition: w.definition,
      example: w.example,
      topic,
    })),
  });

  return NextResponse.json({ words: parsed.words, count: created.count, aiModel: "gemini-1.5-flash" });
}

export async function GET() {
  const words = await prisma.vocabularyWord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ words });
}
