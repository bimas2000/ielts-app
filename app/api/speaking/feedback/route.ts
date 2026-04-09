import { NextRequest, NextResponse } from "next/server";
import { IELTS_SPEAKING_SYSTEM } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { part, question, transcript, duration } = body;

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
    }

    // Speaking uses GPT-4o — excellent at conversational analysis
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1200,
      messages: [
        { role: "system", content: IELTS_SPEAKING_SYSTEM },
        {
          role: "user",
          content: `IELTS Speaking Part ${part}\n\nQUESTION: ${question}\n\nCANDIDATE RESPONSE (transcript):\n${transcript}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    let feedback;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      feedback = null;
    }

    if (!feedback) {
      return NextResponse.json({ error: "Could not parse AI response", raw: text.slice(0, 200) }, { status: 500 });
    }

    const submission = await prisma.speakingSubmission.create({
      data: {
        part,
        question,
        transcript,
        aiFeedback: JSON.stringify(feedback),
        bandScore: feedback.overallBand,
        duration: duration || null,
      },
    });

    await prisma.practiceSession.create({
      data: {
        section: "speaking",
        bandScore: feedback.overallBand,
        duration: duration || null,
      },
    });

    return NextResponse.json({ feedback, submissionId: submission.id, aiModel: "gpt-4o" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
