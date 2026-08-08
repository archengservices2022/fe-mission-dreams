export type Difficulty = "Easy" | "Medium" | "Hard";
export type ContentStatus = "draft" | "review" | "verified" | "published";

export type FESection = {
  id: string;
  title: string;
  examples?: string[];
};

export type FESubject = {
  id: string;
  order: number;
  title: string;
  examQuestionRange: [number, number];
  sections: FESection[];
};

export type FEQuestion = {
  id: string;
  subjectId: string;
  sectionId: string;
  skill: string;
  familyId?: string;
  difficulty: Difficulty;
  prompt: string;
  choices: string[];
  answer: number;
  solution: string;
  trap?: string;
  repair?: string;
  repairQuestionId?: string;
  targetSeconds?: number;
  engineeringContext?: string;
  status: ContentStatus;
};
