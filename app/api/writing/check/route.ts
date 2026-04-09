import { NextRequest, NextResponse } from "next/server";
import { IELTS_WRITING_SYSTEM } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/utils";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskType, prompt, response, timeTaken } = body;

    if (!response || response.trim().length < 50) {
      return NextResponse.json({ error: "Response too short" }, { status: 400 });
    }

    const wordCount = countWords(response);
    const taskLabel = taskType === "task1" ? "Task 1 (150+ words)" : "Task 2 (250+ words)";

    // Writing uses GPT-4o — excellent for detailed essay analysis
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        { role: "system", content: IELTS_WRITING_SYSTEM },
        {
          role: "user",
          content: `IELTS Writing ${taskLabel}\n\nPROMPT:\n${prompt}\n\nCANDIDATE RESPONSE (${wordCount} words):\n${response}`,
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
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

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

    await prisma.practiceSession.create({
      data: {
        section: "writing",
        bandScore: feedback.overallBand,
        duration: timeTaken || null,
      },
    });

    return NextResponse.json({ feedback, submissionId: submission.id, aiModel: "gpt-4o" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
