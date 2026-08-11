import type { Question } from "@/data/module-types";

export type StudentAnswer = number | string;

export type GradeResult = {
  isCorrect: boolean;
  expected: string;
  submitted: string;
};

export function getQuestionType(question: Question) {
  return question.questionType || (typeof question.numericAnswer === "number" ? "numeric" : "multipleChoice");
}

export function gradeQuestion(question: Question, answer: StudentAnswer | null): GradeResult {
  const type = getQuestionType(question);

  if (type === "numeric") {
    const numeric = typeof answer === "number" ? answer : Number(String(answer ?? "").trim());
    const correct = question.numericAnswer ?? 0;
    const tolerance = question.acceptableTolerance ?? 0;
    const isCorrect = Number.isFinite(numeric) && Math.abs(numeric - correct) <= tolerance;

    return {
      isCorrect,
      expected: formatNumericAnswer(correct, question.units),
      submitted: Number.isFinite(numeric) ? formatNumericAnswer(numeric, question.units) : "No numeric answer",
    };
  }

  const selected = typeof answer === "number" ? answer : -1;
  const correctIndex = question.answer ?? -1;
  const choices = question.choices || [];

  return {
    isCorrect: selected === correctIndex,
    expected: choices[correctIndex] || `Choice ${correctIndex + 1}`,
    submitted: selected >= 0 ? choices[selected] || `Choice ${selected + 1}` : "No answer",
  };
}

function formatNumericAnswer(value: number, units?: string) {
  const rounded = Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(6)));
  return units ? `${rounded} ${units}` : rounded;
}
