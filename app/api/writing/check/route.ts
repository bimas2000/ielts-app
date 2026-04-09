import { NextRequest, NextResponse } from "next/server";
import { anthropic, IELTS_WRITING_SYSTEM } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskType, prompt, response, timeTaken } = body;

  if (!response || response.trim().length < 50) {
    return NextResponse.json({ error: "Response too short" }, { status: 400 });
  }

  const wordCount = countWords(response);
  const taskLabel = taskType === "task1" ? "Task 1 (150+ words)" : "Task 2 (250+ words)";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: IELTS_WRITING_SYSTEM,
    messages: [
      {
        role: "user",
        content: `IELTS Writing ${taskLabel}\n\nPROMPT:\n${prompt}\n\nCANDIDATE RESPONSE (${wordCount} words):\n${response}`,
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

  // Save to database
  const submission = await prisma.writingSubmission.create({
    data: {
      taskType,
      prompt,
      response,
      wordCount,
      timeTaken: timeTaken || null,
      aiFeedback: JSON.stringify(feedback),
      bandScore: feedback.overallBand,
    },
  });

  // Update session record
  await prisma.practiceSession.create({
    data: {
      section: "writing",
      bandScore: feedback.overallBand,
      duration: timeTaken || null,
    },
  });

  return NextResponse.json({ feedback, submissionId: submission.id, aiModel: "claude-sonnet-4-6" });
}
