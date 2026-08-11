import { NextResponse } from "next/server";

type TutorRequest = {
  message?: string;
  mode?: string;
  subject?: string;
  topic?: string;
  mastery?: number;
  examDate?: string;
  weakSkills?: string[];
  mistakeCategories?: string[];
};
type TutorContext = Required<Omit<TutorRequest, "message">>;

export async function POST(request: Request) {
  let body: TutorRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const context = {
    mode: body.mode || "guidedPractice",
    subject: body.subject || "Current FE subject",
    topic: body.topic || "Current topic",
    mastery: typeof body.mastery === "number" ? body.mastery : 0,
    examDate: body.examDate || "Not set",
    weakSkills: body.weakSkills || [],
    mistakeCategories: body.mistakeCategories || [],
  };

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ reply: fallbackTutorReply(message, context), source: "fallback" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are FE Mission Dreams, a concise FE exam tutor for Civil, Mechanical, Electrical and Computer, Environmental, Chemical, Industrial and Systems, and Other Disciplines students. Teach instead of simply revealing answers. Use the current subject, topic, mastery, weak skills, mistake history, and exam date. In FE Mode, avoid giving formulas, hints, or solution method unless the student explicitly asks to open/reference the handbook. Encourage FE Reference Handbook familiarity. Keep responses short and actionable.",
          },
          {
            role: "user",
            content: JSON.stringify({ studentMessage: message, context }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ reply: fallbackTutorReply(message, context), source: "fallback" });
    }

    const data = await response.json();
    const reply = data.output_text || data.output?.[0]?.content?.[0]?.text || fallbackTutorReply(message, context);
    return NextResponse.json({ reply, source: "openai" });
  } catch {
    return NextResponse.json({ reply: fallbackTutorReply(message, context), source: "fallback" });
  }
}

function fallbackTutorReply(message: string, context: TutorContext) {
  const weak = context.weakSkills.length ? context.weakSkills.slice(0, 3).join(", ") : "no repeated weak skill yet";
  const mistakes = context.mistakeCategories.length ? context.mistakeCategories.slice(0, 3).join(", ") : "no dominant mistake category yet";

  if (context.mode === "fe") {
    return `FE Mode: I will not give a formula or method unless you explicitly open the handbook. First, restate what the question is asking, identify the units, and choose whether this is a direct lookup, balance, geometry, or property problem. Current weak area: ${weak}.`;
  }

  if (/formula|equation|solve|how/i.test(message)) {
    return `For ${context.topic}, start by naming the knowns, unknown, units, and likely handbook section. Your mastery is ${context.mastery}%, so focus on setup quality before speed. Watch for: ${mistakes}.`;
  }

  return `Good question. In ${context.topic}, the next best move is to explain the concept in your own words, then try one guided problem. Current weak skill signal: ${weak}. If you miss it, classify the error before doing another problem.`;
}
