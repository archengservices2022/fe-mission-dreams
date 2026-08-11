export type Difficulty = "Easy" | "Medium" | "Hard";
export type ContentStatus = "draft" | "review" | "verified" | "published";
export type FEDiscipline =
  | "mechanical"
  | "civil"
  | "electrical-computer"
  | "environmental"
  | "chemical"
  | "industrial-systems"
  | "other-disciplines";
export type QuestionType = "multipleChoice" | "numeric" | "multipleSelect" | "matching";
export type TutorMode = "learn" | "guidedPractice" | "feMode";
export type SubscriptionTier = "free" | "pro";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";
export type MistakeCategory =
  | "Concept misunderstanding"
  | "Wrong formula"
  | "Unit conversion"
  | "Calculator error"
  | "Arithmetic error"
  | "Misread question"
  | "Time management";
export type ReadinessBand = "weak" | "developing" | "nearlyReady" | "ready";

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
  discipline?: FEDiscipline;
  subjectId: string;
  sectionId: string;
  topicId?: string;
  skill: string;
  familyId?: string;
  difficulty: Difficulty;
  questionType?: QuestionType;
  prompt: string;
  choices: string[];
  answer: number;
  numericAnswer?: number;
  acceptableTolerance?: number;
  solution: string;
  formulaUsed?: string;
  units?: string;
  estimatedSolvingTimeSeconds?: number;
  commonMistakes?: MistakeCategory[];
  handbookKeywords?: string[];
  trap?: string;
  repair?: string;
  repairQuestionId?: string;
  targetSeconds?: number;
  engineeringContext?: string;
  status: ContentStatus;
};

export type StudentProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  discipline: FEDiscipline;
  examDate?: string;
  availableStudyHoursPerWeek: number;
  diagnosticScores: Record<string, number>;
  institutionId?: string;
  overallAccuracy?: number;
  overallAttempts?: number;
  readinessBand?: string;
  lastActiveAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Institution = {
  id: string;
  name: string;
  instructorUids: string[];
  inviteCode: string;
  createdBy: string;
  createdAt?: unknown;
};

export type Subscription = {
  uid: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: unknown;
  updatedAt?: unknown;
};

export type MasteryRecord = {
  uid: string;
  subjectId: string;
  sectionId: string;
  topicId: string;
  masteryScore: number;
  readinessBand: ReadinessBand;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  averageResponseTimeSeconds: number;
  lastPracticed?: unknown;
  confidenceLevel: number;
  mistakeCategories: Partial<Record<MistakeCategory, number>>;
  recentResults: boolean[];
  updatedAt?: unknown;
};

export type Attempt = {
  id: string;
  uid: string;
  questionId: string;
  subjectId: string;
  sectionId: string;
  topicId?: string;
  tutorMode: TutorMode;
  studentAnswer: string | number | string[];
  correctAnswer: string | number | string[];
  isCorrect: boolean;
  responseTimeSeconds: number;
  mistakeCategory?: MistakeCategory;
  createdAt?: unknown;
};

export type StudyPlanActivity = {
  id: string;
  type: "recall" | "lesson" | "guidedPractice" | "feMode" | "errorReview";
  subjectId: string;
  sectionId: string;
  topicId?: string;
  targetMinutes: number;
  completed: boolean;
};

export type StudyPlanDay = {
  date: string;
  activities: StudyPlanActivity[];
};

export type StudyPlan = {
  id: string;
  uid: string;
  examDate: string;
  generatedAt?: unknown;
  days: StudyPlanDay[];
};

export type ErrorLog = {
  id: string;
  uid: string;
  questionId: string;
  questionPrompt: string;
  studentAnswer: string;
  correctAnswer: string;
  mistakeCategory: MistakeCategory;
  explanation: string;
  subjectId: string;
  sectionId: string;
  topicId?: string;
  repeatedMistakes: number;
  createdAt?: unknown;
};
