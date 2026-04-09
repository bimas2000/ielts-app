import { NextRequest, NextResponse } from "next/server";
import { anthropic, IELTS_SPEAKING_SYSTEM } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { part, question, transcript, duration } = body;

  if (!transcript || transcript.trim().length < 20) {
    return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: IELTS_SPEAKING_SYSTEM,
    messages: [
      {
        role: "user",
        content: `IELTS Speaking Part ${part}\n\nQUESTION: ${question}\n\nCANDIDATE RESPONSE (transcript):\n${transcript}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  let feedback;
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    feedback = null;
  }

  if (!feedback) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
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

  return NextResponse.json({ feedback, submissionId: submission.id });
}
