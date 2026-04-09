import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// PASSAGE 1 — Academic Reading (Band 6-7 level)
// Topic: Coral Reefs — matches real IELTS style
// ─────────────────────────────────────────────
const PASSAGE_1 = `Coral reefs are among the most biologically diverse ecosystems on Earth. Although they cover less than one percent of the ocean floor, they support approximately 25 percent of all marine species. Often described as the 'rainforests of the sea', coral reefs provide food and shelter to thousands of fish species, molluscs, sea turtles, sharks, and rays.

Coral reefs are built by colonies of tiny animals called coral polyps, which secrete calcium carbonate to form hard skeletons. These structures accumulate over thousands of years to create the complex reef architecture we see today. The symbiotic relationship between coral polyps and microscopic algae called zooxanthellae is fundamental to reef survival. The algae live within the coral tissue and provide up to 90 percent of the coral's energy through photosynthesis, while the coral provides the algae with shelter and compounds needed for photosynthesis.

When water temperatures rise just one or two degrees above the normal summer maximum, corals expel their zooxanthellae in a process known as coral bleaching. Without the algae, the coral turns white and, if the stress persists for several weeks, the coral will die. Mass coral bleaching events have become significantly more frequent and severe since the 1980s, linked directly to global warming.

Human activities pose additional threats. Coastal development, agricultural run-off and sewage contaminate reef waters with excessive nutrients that stimulate algal overgrowth, smothering corals. Overfishing removes herbivorous fish that keep algae in check, and destructive fishing practices such as blast fishing and cyanide fishing directly damage reef structures. The tourism industry, though economically vital for many reef communities, can cause physical damage through careless boat anchoring, snorkelling, and diving.

Despite these threats, coral reefs demonstrate remarkable resilience. Some reefs have recovered from bleaching events within a decade when given adequate protection. Marine protected areas, local fishery management, water quality improvement, and the active restoration of coral populations through coral gardening offer realistic pathways to reef survival. Scientists are also exploring the potential of breeding more heat-tolerant coral strains as a longer-term solution.`;

// ─────────────────────────────────────────────
// PASSAGE 2 — Academic Reading (Band 7-8 level)
// Topic: Remote Work — shorter passage
// ─────────────────────────────────────────────
const PASSAGE_2 = `The rapid expansion of remote work, accelerated dramatically by the COVID-19 pandemic, has fundamentally altered assumptions about where and how productive work can take place. Prior to 2020, approximately 5 percent of full-time employees in the United States worked primarily from home; by mid-2020, that figure had risen to over 60 percent. While many of these workers have since returned to offices, surveys consistently indicate that a substantial majority prefer hybrid arrangements that blend in-person and remote work.

Proponents of remote work emphasise several advantages. Employees report reduced commuting time, greater flexibility in managing work-life balance, and in some studies, higher productivity for individual, focus-intensive tasks. Organisations benefit from access to a geographically unrestricted talent pool and, in many cases, reduced expenditure on office space.

Critics, however, point to significant drawbacks. Spontaneous collaboration, the informal exchange of ideas that often occurs in shared physical spaces, is difficult to replicate online. Junior employees, in particular, may miss out on mentoring opportunities that arise naturally in office environments. Furthermore, the boundary between professional and personal life can become blurred when the home serves as a workplace, contributing to longer working hours and increased rates of burnout among some workers.

The long-term effects of remote work on career progression, organisational culture, and urban economies remain subjects of active research. Cities heavily dependent on office workers have experienced notable declines in foot traffic and revenue for local businesses. Whether these shifts prove temporary or represent a permanent restructuring of working patterns remains to be seen.`;

const READING_QUESTIONS = [
  // ── Passage 1 ──────────────────────────────────────────────
  {
    section: "reading", type: "mcq", passage: PASSAGE_1,
    question: "What percentage of all marine species are supported by coral reefs?",
    options: JSON.stringify(["Less than 1%", "About 10%", "Approximately 25%", "More than 50%"]),
    answer: "Approximately 25%",
    explanation: "Paragraph 1: 'they support approximately 25 percent of all marine species.'",
    difficulty: "easy", partNumber: 1,
  },
  {
    section: "reading", type: "mcq", passage: null,
    question: "What is the primary function of zooxanthellae in coral reefs?",
    options: JSON.stringify([
      "They form the calcium carbonate skeleton of the coral",
      "They provide the coral with up to 90% of its energy via photosynthesis",
      "They protect coral from rising water temperatures",
      "They filter pollutants from the surrounding water",
    ]),
    answer: "They provide the coral with up to 90% of its energy via photosynthesis",
    explanation: "Paragraph 2: 'The algae live within the coral tissue and provide up to 90 percent of the coral's energy through photosynthesis.'",
    difficulty: "medium", partNumber: 1,
  },
  {
    section: "reading", type: "true-false-ng", passage: null,
    question: "Coral bleaching occurs when water temperatures fall below seasonal averages.",
    options: JSON.stringify(["True", "False", "Not Given"]),
    answer: "False",
    explanation: "Paragraph 3: bleaching occurs when temperatures rise 'just one or two degrees ABOVE the normal summer maximum', not fall below.",
    difficulty: "medium", partNumber: 1,
  },
  {
    section: "reading", type: "true-false-ng", passage: null,
    question: "Mass coral bleaching events have become more frequent since the 1980s.",
    options: JSON.stringify(["True", "False", "Not Given"]),
    answer: "True",
    explanation: "Paragraph 3: 'Mass coral bleaching events have become significantly more frequent and severe since the 1980s.'",
    difficulty: "easy", partNumber: 1,
  },
  {
    section: "reading", type: "true-false-ng", passage: null,
    question: "Coral gardening was first developed in Australia.",
    options: JSON.stringify(["True", "False", "Not Given"]),
    answer: "Not Given",
    explanation: "The passage mentions coral gardening as a restoration method but does not state where it was first developed.",
    difficulty: "medium", partNumber: 1,
  },
  {
    section: "reading", type: "fill-blank", passage: null,
    question: "The removal of ___ fish by overfishing allows algae to overgrow and smother corals.",
    options: null,
    answer: "herbivorous",
    explanation: "Paragraph 4: 'Overfishing removes herbivorous fish that keep algae in check.'",
    difficulty: "hard", partNumber: 1,
  },
  {
    section: "reading", type: "mcq", passage: null,
    question: "According to the final paragraph, which approach involves breeding corals that can withstand higher temperatures?",
    options: JSON.stringify([
      "Marine protected areas",
      "Coral gardening",
      "Developing heat-tolerant coral strains",
      "Local fishery management",
    ]),
    answer: "Developing heat-tolerant coral strains",
    explanation: "Final paragraph: 'Scientists are also exploring the potential of breeding more heat-tolerant coral strains.'",
    difficulty: "medium", partNumber: 1,
  },

  // ── Passage 2 ──────────────────────────────────────────────
  {
    section: "reading", type: "mcq", passage: PASSAGE_2,
    question: "According to the passage, what proportion of US full-time employees worked primarily from home by mid-2020?",
    options: JSON.stringify(["5 percent", "Over 30 percent", "Over 60 percent", "Almost 90 percent"]),
    answer: "Over 60 percent",
    explanation: "Paragraph 1: 'by mid-2020, that figure had risen to over 60 percent.'",
    difficulty: "easy", partNumber: 2,
  },
  {
    section: "reading", type: "true-false-ng", passage: null,
    question: "Most workers surveyed prefer to work entirely from home rather than in an office.",
    options: JSON.stringify(["True", "False", "Not Given"]),
    answer: "False",
    explanation: "Paragraph 1 states workers prefer 'hybrid arrangements that blend in-person and remote work', NOT fully remote.",
    difficulty: "hard", partNumber: 2,
  },
  {
    section: "reading", type: "mcq", passage: null,
    question: "Which group does the passage identify as being particularly disadvantaged by remote work?",
    options: JSON.stringify(["Senior executives", "IT workers", "Junior employees", "Part-time contractors"]),
    answer: "Junior employees",
    explanation: "Paragraph 3: 'Junior employees, in particular, may miss out on mentoring opportunities that arise naturally in office environments.'",
    difficulty: "medium", partNumber: 2,
  },
  {
    section: "reading", type: "fill-blank", passage: null,
    question: "Remote work allows organisations to access a geographically ___ talent pool.",
    options: null,
    answer: "unrestricted",
    explanation: "Paragraph 2: 'access to a geographically unrestricted talent pool.'",
    difficulty: "medium", partNumber: 2,
  },
  {
    section: "reading", type: "true-false-ng", passage: null,
    question: "The passage concludes that remote work patterns will permanently replace traditional office-based work.",
    options: JSON.stringify(["True", "False", "Not Given"]),
    answer: "Not Given",
    explanation: "The final paragraph states 'Whether these shifts prove temporary or represent a permanent restructuring... remains to be seen.' — no definitive conclusion is given.",
    difficulty: "hard", partNumber: 2,
  },
];

export async function POST() {
  // Delete existing and reseed with accurate questions
  await prisma.question.deleteMany({ where: { section: "reading" } });
  await prisma.question.createMany({ data: READING_QUESTIONS });
  return NextResponse.json({ success: true, count: READING_QUESTIONS.length });
}
