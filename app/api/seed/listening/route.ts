import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────
// IELTS Listening — Accurate sample questions per Part
// Note: In a real app these would be paired with audio files.
// These text-based questions practice the SAME skills.
// ─────────────────────────────────────────────────────────────

const LISTENING_QUESTIONS = [

  // ════════════════════════════════════════
  // PART 1 — Everyday Social Context
  // Scenario: Phone call to book a fitness class
  // ════════════════════════════════════════
  {
    section: "listening", type: "fill-blank", partNumber: 1,
    passage: `[Part 1 — Everyday conversation]\nScenario: A woman calls a gym to register for a yoga class.\n\nReceptionist: Good morning, Active Life Gym. How can I help?\nCaller: Hi, I'd like to register for the Tuesday yoga class.\nReceptionist: Of course. Can I take your name?\nCaller: It's Rachel Thornton. T-H-O-R-N-T-O-N.\nReceptionist: And a contact number?\nCaller: 07 double 4 9, 5 1 3 2 6 7.\nReceptionist: The class starts at quarter past seven in the evening. The cost is £12 per session, or £40 for a monthly pass. Which would you prefer?\nCaller: The monthly pass, please.\nReceptionist: Great. Could I take a membership number if you have one?\nCaller: Yes, it's GY dash 8 8 5 1.`,
    question: "What is the caller's last name?",
    options: null,
    answer: "Thornton",
    explanation: "Part 1 Tip: Names are often spelled out. Always write exactly what you hear, including capitalisation.",
    difficulty: "easy",
  },
  {
    section: "listening", type: "fill-blank", partNumber: 1,
    passage: null,
    question: "What time does the yoga class begin? (Write in words, e.g. 'quarter past seven')",
    options: null,
    answer: "quarter past seven",
    explanation: "Tip: Time expressions like 'quarter past', 'half past', 'ten to' are common in Part 1.",
    difficulty: "easy",
  },
  {
    section: "listening", type: "mcq", partNumber: 1,
    passage: null,
    question: "Which payment option does the caller choose?",
    options: JSON.stringify(["£12 per session", "£40 monthly pass", "Direct debit", "Annual membership"]),
    answer: "£40 monthly pass",
    explanation: "Tip: In Part 1, there are often 'distractors' — listen for what the caller FINALLY decides, not the first option mentioned.",
    difficulty: "easy",
  },
  {
    section: "listening", type: "fill-blank", partNumber: 1,
    passage: null,
    question: "What is the caller's membership number?",
    options: null,
    answer: "GY-8851",
    explanation: "Tip: Codes and reference numbers often mix letters and numbers. Write them exactly as heard.",
    difficulty: "medium",
  },

  // ════════════════════════════════════════
  // PART 2 — Monologue in Social Context
  // Scenario: Tour guide speaking to visitors
  // ════════════════════════════════════════
  {
    section: "listening", type: "mcq", partNumber: 2,
    passage: `[Part 2 — Monologue]\nScenario: A guide is introducing visitors to a heritage museum.\n\n"Welcome to Harwick Heritage Museum. Today I'll be taking you through the East Wing first, which covers the town's industrial history from 1800 to 1950. The West Wing, covering modern history, will open next spring after renovation. The café on the ground floor closes at 4:30 pm, not 5 pm as printed in some older brochures. Photography is permitted throughout the museum, except in the Special Exhibitions Room on the second floor. If you have children under 12, please note that the interactive Discovery Zone is on the first floor and is available free of charge. The gift shop, located near the main entrance, has a 20% discount today for all group visitors."`,
    question: "Which wing of the museum is currently closed for renovation?",
    options: JSON.stringify(["East Wing", "West Wing", "North Wing", "South Wing"]),
    answer: "West Wing",
    explanation: "Part 2 Tip: Monologues often include corrections to printed information — the SPOKEN information is always correct.",
    difficulty: "medium",
  },
  {
    section: "listening", type: "fill-blank", partNumber: 2,
    passage: null,
    question: "At what time does the café close? (Write as numbers, e.g. 4:30 pm)",
    options: null,
    answer: "4:30 pm",
    explanation: "Tip: When a speaker corrects previously stated information, always record the corrected version.",
    difficulty: "medium",
  },
  {
    section: "listening", type: "mcq", partNumber: 2,
    passage: null,
    question: "In which area is photography NOT permitted?",
    options: JSON.stringify(["East Wing", "Café", "Special Exhibitions Room", "Discovery Zone"]),
    answer: "Special Exhibitions Room",
    explanation: "Tip: Negative questions ('NOT permitted', 'EXCEPT') are very common in Part 2 — underline them when you see them.",
    difficulty: "medium",
  },
  {
    section: "listening", type: "fill-blank", partNumber: 2,
    passage: null,
    question: "Group visitors receive a ___% discount in the gift shop today.",
    options: null,
    answer: "20",
    explanation: "Tip: Numbers and percentages require careful listening — 13 and 30, 15 and 50 can sound similar.",
    difficulty: "medium",
  },

  // ════════════════════════════════════════
  // PART 3 — Discussion in Academic Context
  // Scenario: Two students discussing a research project
  // ════════════════════════════════════════
  {
    section: "listening", type: "mcq", partNumber: 3,
    passage: `[Part 3 — Academic discussion]\nScenario: Two students, Maya and Tom, discuss their group research project with a tutor.\n\nMaya: We've finished collecting our survey data, but I'm worried our sample is too small — we only managed 45 responses.\nTutor: That is on the low side for quantitative analysis. What were you hoping to achieve?\nTom: We were aiming for at least 80. We had problems getting responses from the engineering faculty.\nTutor: I'd suggest supplementing with a few in-depth interviews to add qualitative depth, rather than trying to collect more surveys at this late stage.\nMaya: I was thinking the same — maybe five or six interviews?\nTutor: That sounds reasonable. What's your timeline looking like for the analysis phase?\nTom: We've allocated two weeks, but I think we might need three given the additional interviews.\nTutor: Be realistic. I'd recommend submitting a revised timeline to me by Friday so we can discuss it.`,
    question: "What is the main problem Maya identifies with the research?",
    options: JSON.stringify([
      "The survey questions were poorly written",
      "The sample size is too small",
      "They ran out of time to analyse the data",
      "The engineering faculty refused to participate",
    ]),
    answer: "The sample size is too small",
    explanation: "Part 3 Tip: In academic discussions, identify WHO says WHAT. Maya specifically raises the concern about sample size.",
    difficulty: "medium",
  },
  {
    section: "listening", type: "mcq", partNumber: 3,
    passage: null,
    question: "What does the tutor recommend instead of collecting more surveys?",
    options: JSON.stringify([
      "Extending the submission deadline",
      "Conducting in-depth interviews for qualitative data",
      "Reducing the scope of the research question",
      "Repeating the survey with a different group",
    ]),
    answer: "Conducting in-depth interviews for qualitative data",
    explanation: "Tip: The tutor's suggestion is a direct recommendation — listen for phrases like 'I'd suggest', 'Why not', 'Have you considered'.",
    difficulty: "medium",
  },
  {
    section: "listening", type: "fill-blank", partNumber: 3,
    passage: null,
    question: "The tutor asks the students to submit a revised ___ by Friday.",
    options: null,
    answer: "timeline",
    explanation: "Tip: Academic vocabulary like 'timeline', 'methodology', 'findings' are common in Part 3.",
    difficulty: "hard",
  },

  // ════════════════════════════════════════
  // PART 4 — Academic Monologue (Lecture)
  // Scenario: Lecture on sleep and cognition
  // ════════════════════════════════════════
  {
    section: "listening", type: "fill-blank", partNumber: 4,
    passage: `[Part 4 — Academic lecture]\nScenario: A university lecture on sleep science.\n\n"Today I want to discuss the relationship between sleep and cognitive performance. It is now well-established that sleep deprivation significantly impairs working memory — that is, our ability to hold and manipulate information in the short term. Studies show that after 17 to 19 hours without sleep, cognitive impairment becomes equivalent to having a blood alcohol level of 0.05 percent.\n\nSleep consists of several stages, the most critical for memory consolidation being the rapid eye movement stage, commonly known as REM sleep. During REM sleep, the brain actively processes and transfers information from short-term to long-term memory — a process called memory consolidation.\n\nSurprisingly, a short nap of 20 to 30 minutes — sometimes called a 'power nap' — has been shown to restore alertness and improve performance on tasks requiring sustained attention. However, naps exceeding 30 minutes risk inducing what researchers call 'sleep inertia', a period of grogginess that can temporarily worsen performance immediately after waking.\n\nFor students preparing for examinations, the research is clear: replacing revision time with sleep in the final 24 hours before an exam is likely to improve performance more than additional studying in a sleep-deprived state."`,
    question: "According to the lecture, which stage of sleep is most important for memory consolidation?",
    options: null,
    answer: "REM sleep",
    explanation: "Part 4 Tip: Technical terms in lectures are often defined. Listen for 'this is called', 'known as', 'referred to as'.",
    difficulty: "medium",
  },
  {
    section: "listening", type: "mcq", partNumber: 4,
    passage: null,
    question: "What does the lecturer say happens after approximately 17–19 hours without sleep?",
    options: JSON.stringify([
      "REM sleep increases significantly",
      "Cognitive impairment equals a blood alcohol level of 0.05%",
      "Long-term memory begins to deteriorate permanently",
      "Performance on physical tasks improves due to adrenaline",
    ]),
    answer: "Cognitive impairment equals a blood alcohol level of 0.05%",
    explanation: "Tip: Statistics and comparisons are frequently tested in Part 4 — note exact numbers.",
    difficulty: "hard",
  },
  {
    section: "listening", type: "fill-blank", partNumber: 4,
    passage: null,
    question: "A nap exceeding 30 minutes risks causing ___, a period of grogginess after waking.",
    options: null,
    answer: "sleep inertia",
    explanation: "Tip: Scientific terms are often defined in context — 'sleep inertia', defined as 'a period of grogginess'.",
    difficulty: "hard",
  },
  {
    section: "listening", type: "mcq", partNumber: 4,
    passage: null,
    question: "What advice does the lecturer give to students before an exam?",
    options: JSON.stringify([
      "Study through the night to maximise revision time",
      "Take a long nap of at least two hours",
      "Prioritise sleep over additional revision in the final 24 hours",
      "Avoid REM sleep by setting an alarm every 90 minutes",
    ]),
    answer: "Prioritise sleep over additional revision in the final 24 hours",
    explanation: "Tip: Lectures often end with a practical recommendation — this is frequently the final question in Part 4.",
    difficulty: "medium",
  },
];

export async function POST() {
  await prisma.question.deleteMany({ where: { section: "listening" } });
  await prisma.question.createMany({ data: LISTENING_QUESTIONS });
  return NextResponse.json({ success: true, count: LISTENING_QUESTIONS.length });
}
