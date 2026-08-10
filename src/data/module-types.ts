export type Lesson = { title: string; body: string };
export type Flashcard = { front: string; back: string; note: string };
export type Question = {
  id: string; skill: string; difficulty: "Easy" | "Medium" | "Hard"; prompt: string; choices: string[]; answer: number;
  explanation: string; solution: string; trap: string; repair: string;
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
