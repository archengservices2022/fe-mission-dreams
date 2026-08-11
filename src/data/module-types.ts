export type Lesson = { title: string; body: string };
export type Flashcard = { front: string; back: string; note: string };
export type QuestionType = "multipleChoice" | "numeric";
export type MistakeCategory =
  | "Concept misunderstanding"
  | "Wrong formula"
  | "Unit conversion"
  | "Calculator error"
  | "Arithmetic error"
  | "Misread question"
  | "Time management";
export type Question = {
  id: string;
  skill: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
  questionType?: QuestionType;
  choices?: string[];
  answer?: number;
  numericAnswer?: number;
  acceptableTolerance?: number;
  units?: string;
  formulaUsed?: string;
  estimatedSolvingTimeSeconds?: number;
  commonMistakes?: MistakeCategory[];
  handbookKeywords?: string[];
  explanation: string;
  solution: string;
  trap: string;
  repair: string;
};

export type StudyModule = {
  id: string;
  subjectId: string;
  sectionId: string;
  title: string;
  lessons: Lesson[];
  flashcards: Flashcard[];
  questions: Question[];
};
