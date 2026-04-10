import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const TUTOR_SYSTEM = `You are IELTS Pro Tutor — a friendly, encouraging AI tutor helping Indonesian students prepare for the IELTS exam.

Your role:
- Answer questions about IELTS exam strategies, tips, and techniques
- Help students understand grammar, vocabulary, and language use
- Give specific feedback and suggestions in a warm, motivating tone
- Mix Indonesian and English naturally (like a bilingual tutor)
- Keep responses SHORT and actionable (2-4 sentences max unless asked for more)
- Use simple examples and analogies
- When asked about a specific section (reading/listening/writing/speaking), give targeted tips

Personality: Friendly, patient, encouraging. Like a kakak senior yang sudah dapat band 8.0.

IMPORTANT: Keep responses concise. Don't over-explain. Give 1 key tip at a time.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemWithContext = context
      ? `${TUTOR_SYSTEM}\n\nCurrent context: User is on the ${context} section/page.`
      : TUTOR_SYSTEM;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      messages: [
        { role: "system", content: systemWithContext },
        ...messages.slice(-8), // Keep last 8 messages for context
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "Maaf, tidak bisa menjawab sekarang.";
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
