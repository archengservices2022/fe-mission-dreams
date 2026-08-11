import { moduleRegistry } from "./modules";
import type { MistakeCategory, Question } from "../module-types";

const defaultTimingByDifficulty: Record<Question["difficulty"], number> = {
  Easy: 75,
  Medium: 105,
  Hard: 140,
};

const mistakeRules: Array<{ pattern: RegExp; category: MistakeCategory }> = [
  { pattern: /\b(unit|convert|conversion|kpa|mpa|mm|cm|meter|metre|pa\b|kelvin|celsius|degree|factor of 1000)\b/i, category: "Unit conversion" },
  { pattern: /\b(formula|equation|law|relation|ratio|inverse|reciprocal|wrong side|sign convention)\b/i, category: "Wrong formula" },
  { pattern: /\b(add|subtract|minus|plus|negative|positive|direction|inlet|outlet|clockwise|counterclockwise|compress|expand)\b/i, category: "Concept misunderstanding" },
  { pattern: /\b(arithmetic|decimal|round|multiply|divide|square|cube|exponent|calculator|log|sqrt|sine|cosine|tangent)\b/i, category: "Calculator error" },
  { pattern: /\b(misread|given|stated|asks|requested|instead of|which material|which value)\b/i, category: "Misread question" },
];

function enrichQuestion(question: Question, module: (typeof moduleRegistry)[string]) {
  return {
    ...question,
    discipline: "mechanical",
    subjectId: module.subjectId,
    sectionId: module.sectionId,
    moduleId: module.id,
    status: "published",
    questionType: question.questionType || (typeof question.numericAnswer === "number" ? "numeric" : "multipleChoice"),
    formulaUsed: question.formulaUsed || inferFormula(question, module),
    estimatedSolvingTimeSeconds: question.estimatedSolvingTimeSeconds || inferTiming(question),
    commonMistakes: question.commonMistakes || inferMistakes(question),
    handbookKeywords: question.handbookKeywords || inferKeywords(question, module),
  };
}

function inferFormula(question: Question, module: (typeof moduleRegistry)[string]) {
  const skill = normalize(question.skill);
  const skillTokens = new Set(skill.split(" ").filter((token) => token.length > 2));
  const related = module.flashcards.find((card) => {
    const haystack = normalize(`${card.front} ${card.note}`);
    return [...skillTokens].some((token) => haystack.includes(token));
  });

  return related?.back || module.flashcards[0]?.back;
}

function inferTiming(question: Question) {
  const base = defaultTimingByDifficulty[question.difficulty] || 105;
  const needsLongCalculation = /\b(composite|combined|design|sizing|heat exchanger|manometer|cycle|von mises|momentum|Bernoulli)\b/i.test(
    `${question.skill} ${question.prompt}`,
  );

  return base + (needsLongCalculation ? 20 : 0);
}

function inferMistakes(question: Question): MistakeCategory[] {
  const haystack = `${question.prompt} ${question.trap} ${question.repair} ${question.solution}`;
  const categories = mistakeRules
    .filter((rule) => rule.pattern.test(haystack))
    .map((rule) => rule.category);

  const uniqueCategories = Array.from(new Set(categories)).slice(0, 3);
  return uniqueCategories.length ? uniqueCategories : ["Wrong formula", "Misread question"];
}

function inferKeywords(question: Question, module: (typeof moduleRegistry)[string]) {
  const source = `${question.skill} ${module.title} ${module.sectionId}`;
  const words = normalize(source)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return Array.from(new Set([module.title, question.skill, ...words])).slice(0, 8);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const stopWords = new Set([
  "and",
  "the",
  "from",
  "with",
  "for",
  "into",
  "using",
  "find",
  "analysis",
  "systems",
  "fundamentals",
]);

export const questionBank = Object.values(moduleRegistry).flatMap((module) =>
  module.questions.map((question) => enrichQuestion(question, module)),
);
