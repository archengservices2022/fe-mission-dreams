import type { FEDiscipline } from "@/types/fe";
import type { StudyModule } from "../module-types";

function starterModule(id: string, subjectId: string, sectionId: string, title: string, context: string): StudyModule {
  return {
    id,
    subjectId,
    sectionId,
    title,
    lessons: [
      {
        title: "How this discipline starts",
        body: `${context} This starter module is a safe entry point while the full discipline question bank is being built. Use it to test the dashboard, planner, calculator, and FE Mode flow for this discipline.`,
      },
      {
        title: "First study move",
        body: "Begin with math, ethics, economics, and the highest-weight discipline subjects. The coverage screen shows which sections already have production lessons, flashcards, and questions connected.",
      },
    ],
    flashcards: [
      { front: "FE exam format", back: "110 questions in a 6-hour appointment", note: "The exam portion is 5 hours and 20 minutes." },
      { front: "Best first pass", back: "Build evidence by topic", note: "Accuracy, timing, and mistake category matter more than rereading notes." },
      { front: "Content status", back: "Coverage marks ready sections", note: "A section is ready when lessons, formulas, and enough questions are connected." },
    ],
    questions: [
      {
        id: `${id}-Q01`,
        skill: "Unit rate",
        difficulty: "Easy",
        prompt: "A student completes 18 practice questions in 45 minutes. What is the average time per question?",
        choices: ["1.5 min/question", "2.0 min/question", "2.5 min/question", "3.0 min/question"],
        answer: 2,
        explanation: "The average is 45 minutes divided by 18 questions, or 2.5 minutes per question.",
        solution: "Step 1 - Average time = total time / number of questions.\nStep 2 - 45 / 18 = 2.5.\nFinal answer: 2.5 min/question.",
        trap: "Using questions per minute gives the reciprocal rate.",
        repair: "Check whether the answer asks for minutes per question or questions per minute.",
        formulaUsed: "average time = total time / count",
        estimatedSolvingTimeSeconds: 45,
        commonMistakes: ["Misread question", "Arithmetic error"],
        handbookKeywords: ["unit rate", "exam timing"],
      },
      {
        id: `${id}-Q02`,
        skill: "Weighted average",
        difficulty: "Medium",
        prompt: "A readiness estimate weights Subject A at 12 questions with 80% readiness and Subject B at 8 questions with 60% readiness. What is the weighted readiness?",
        choices: ["68%", "70%", "72%", "76%"],
        answer: 2,
        explanation: "The weighted readiness is 72%.",
        solution: "Step 1 - Weighted average = (12)(80) + (8)(60) divided by 20.\nStep 2 - (960 + 480) / 20 = 1440 / 20.\nFinal answer: 72%.",
        trap: "A simple average gives 70%, but the subjects have different weights.",
        repair: "Multiply each score by its question weight before averaging.",
        formulaUsed: "weighted average = sum(w x) / sum(w)",
        estimatedSolvingTimeSeconds: 75,
        commonMistakes: ["Wrong formula", "Arithmetic error"],
        handbookKeywords: ["weighted average", "readiness"],
      },
      {
        id: `${id}-Q03`,
        skill: "Study planning",
        difficulty: "Easy",
        prompt: "Which topic should an adaptive FE plan prioritize first?",
        choices: ["A low-weight topic already above target", "A high-weight topic with low accuracy", "The topic with the shortest name", "Only the most recent topic studied"],
        answer: 1,
        explanation: "A high-weight weak topic gives the largest readiness gain.",
        solution: "Adaptive planning should consider exam weight and current weakness. High-weight weak areas are the best first repair targets.",
        trap: "Recent work matters, but it should not override exam weight and weakness.",
        repair: "Prioritize by weight, weakness, evidence, and time remaining.",
        formulaUsed: "priority = weight x weakness",
        estimatedSolvingTimeSeconds: 40,
        commonMistakes: ["Concept misunderstanding"],
        handbookKeywords: ["study plan", "adaptive practice"],
      },
    ],
  };
}

export const additionalModuleRegistries: Record<Exclude<FEDiscipline, "mechanical" | "civil">, Record<string, StudyModule>> = {
  "electrical-computer": Object.fromEntries([
    starterModule("EC-START-01", "math", "algebra-trig", "Electrical & Computer FE Starter", "Electrical and computer students should build early fluency in circuits, power, electronics, signals, controls, digital logic, computer systems, and software fundamentals."),
  ].map((module) => [`${module.subjectId}:${module.sectionId}`, module])),
  environmental: Object.fromEntries([
    starterModule("ENV-START-01", "math", "algebra", "Environmental FE Starter", "Environmental students should build early fluency in chemistry, mass balances, fluid mechanics, hydrology, water/wastewater, air quality, waste, and health/safety."),
  ].map((module) => [`${module.subjectId}:${module.sectionId}`, module])),
  chemical: Object.fromEntries([
    starterModule("CHE-START-01", "math", "algebra", "Chemical FE Starter", "Chemical students should build early fluency in material balances, thermodynamics, fluids, heat transfer, separations, reaction engineering, process design, controls, and safety."),
  ].map((module) => [`${module.subjectId}:${module.sectionId}`, module])),
  "industrial-systems": Object.fromEntries([
    starterModule("ISE-START-01", "math", "algebra", "Industrial & Systems FE Starter", "Industrial and systems students should build early fluency in probability, statistics, engineering economics, modeling, manufacturing/service systems, logistics, work design, quality, and systems engineering."),
  ].map((module) => [`${module.subjectId}:${module.sectionId}`, module])),
  "other-disciplines": Object.fromEntries([
    starterModule("OD-START-01", "math", "algebra-trig", "Other Disciplines FE Starter", "Other Disciplines students need a broad general engineering review across math, mechanics, fluids, thermodynamics, electricity, chemistry, instrumentation, safety, and economics."),
  ].map((module) => [`${module.subjectId}:${module.sectionId}`, module])),
};
