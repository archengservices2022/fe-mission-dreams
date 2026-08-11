import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "@/lib/server/firebase-admin";

type AdminQuestionDraft = {
  prompt?: string;
  skill?: string;
  subjectId?: string;
  sectionId?: string;
  difficulty?: string;
  questionType?: "multipleChoice" | "numeric";
  answer?: string;
  choices?: string[];
  numericAnswer?: number;
  acceptableTolerance?: number;
  units?: string;
  formulaUsed?: string;
  handbookKeywords?: string[];
  commonMistakes?: string[];
  solution?: string;
  trap?: string;
  repair?: string;
};

export async function POST(request: Request) {
  try {
    const decoded = await verifyBearerToken(request);
    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Admin permission is required." }, { status: 403 });
    }

    const draft = await request.json() as AdminQuestionDraft;
    const prompt = String(draft.prompt || "").trim();
    const skill = String(draft.skill || "").trim();
    const solution = String(draft.solution || "").trim();
    const questionType = draft.questionType === "numeric" ? "numeric" : "multipleChoice";
    const choices = Array.isArray(draft.choices) ? draft.choices.map((choice) => String(choice).trim()).filter(Boolean) : [];

    if (!prompt || !skill || !solution) {
      return NextResponse.json({ error: "Prompt, skill, and solution are required." }, { status: 400 });
    }

    if (questionType === "multipleChoice" && (choices.length < 2 || !String(draft.answer || "").trim())) {
      return NextResponse.json({ error: "Multiple-choice drafts require at least two choices and a correct answer." }, { status: 400 });
    }

    if (questionType === "numeric" && !Number.isFinite(draft.numericAnswer)) {
      return NextResponse.json({ error: "Numeric drafts require a numeric answer." }, { status: 400 });
    }

    const reviewRef = adminDb().collection("adminReviews").doc();
    await reviewRef.set({
      id: reviewRef.id,
      type: "questionDraft",
      status: "review",
      submittedBy: decoded.uid,
      submittedByEmail: decoded.email || null,
      subjectId: draft.subjectId || "math",
      sectionId: draft.sectionId || "trigonometry",
      difficulty: draft.difficulty || "Medium",
      questionType,
      prompt,
      skill,
      answer: String(draft.answer || "").trim(),
      choices,
      numericAnswer: questionType === "numeric" ? draft.numericAnswer : null,
      acceptableTolerance: questionType === "numeric" && Number.isFinite(draft.acceptableTolerance) ? draft.acceptableTolerance : null,
      units: String(draft.units || "").trim(),
      formulaUsed: String(draft.formulaUsed || "").trim(),
      handbookKeywords: Array.isArray(draft.handbookKeywords) ? draft.handbookKeywords.map((item) => String(item).trim()).filter(Boolean) : [],
      commonMistakes: Array.isArray(draft.commonMistakes) ? draft.commonMistakes.map((item) => String(item).trim()).filter(Boolean) : [],
      solution,
      trap: String(draft.trap || "").trim(),
      repair: String(draft.repair || "").trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: reviewRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question draft could not be saved.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
