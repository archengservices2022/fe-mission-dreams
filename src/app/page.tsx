"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, deleteField, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import {
  BookOpen,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ClipboardList,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  Globe,
  Layers,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  PlayCircle,
  Rocket,
  Flag,
  Target,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getQuestionType, gradeQuestion } from "@/lib/grading";
import Formula from "@/components/Formula";
import { feMechanicalSubjects } from "@/data/fe-mechanical/subjects";
import { moduleRegistry } from "@/data/fe-mechanical/modules";
import { feCivilSubjects } from "@/data/fe-civil/subjects";
import { civilModuleRegistry } from "@/data/fe-civil/modules";
import {
  feChemicalSubjects,
  feElectricalComputerSubjects,
  feEnvironmentalSubjects,
  feIndustrialSystemsSubjects,
  feOtherDisciplinesSubjects,
} from "@/data/fe-additional/subjects";
import { additionalModuleRegistries } from "@/data/fe-additional/modules";
import type { FEDiscipline, FESection, FESubject, Institution, MistakeCategory, StudentProfile, Subscription } from "@/types/fe";
import type { Question, StudyModule } from "@/data/module-types";

type ModuleScreen = "home" | "learn" | "reference" | "flash" | "recall" | "packets" | "practice" | "fe" | "mock" | "tutor" | "errors" | "mastery";
type AppView = "dashboard" | "coverage" | "subject" | "module";
type Progress = {
  correct?: number;
  attempts?: number;
  mastery?: number;
  weakSkills?: Record<string, number>;
  mistakeCategories?: Partial<Record<MistakeCategory, number>>;
  recentResults?: boolean[];
  lessonIndex?: number;
  subjectId?: string;
  sectionId?: string;
  averageResponseTimeSeconds?: number;
  totalResponseTimeSeconds?: number;
  activeDays?: Record<string, boolean>;
  updatedAt?: { toMillis?: () => number } | null;
};
type CalculatorScores = Record<string, number>;
type ProfileDraft = {
  discipline: FEDiscipline;
  examDate: string;
  availableStudyHoursPerWeek: number;
  diagnosticScores: CalculatorScores;
};
type DailyPlanActivity = {
  id: string;
  title: string;
  detail: string;
  minutes: number;
  kind: "recall" | "lesson" | "guided" | "fe" | "review";
  subjectId: string;
  sectionId: string;
  skill?: string;
  priorityScore?: number;
  rationale?: string;
};
type SavedDailyPlan = {
  date: string;
  activities: DailyPlanActivity[];
  completed: Record<string, boolean>;
  signature: string;
  generatedAt?: unknown;
  updatedAt?: unknown;
};
type RecallItem = {
  id: string;
  prompt: string;
  answer: string;
  source: string;
  subjectId: string;
  sectionId: string;
  skill?: string;
  dueReason: "missed" | "formula" | "stale";
};
type ErrorNotebookEntry = {
  id: string;
  questionId: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  mistakeCategory: MistakeCategory;
  explanation: string;
  subjectId: string;
  sectionId: string;
  moduleTitle: string;
  skill: string;
  repeatedMistakes: number;
  lastMissedAt?: unknown;
};
type MockExamSize = 10 | 20 | 50;
type MockExamAnswer = {
  questionId: string;
  answer: string | number;
};
type MockExamResult = {
  questionId: string;
  submitted: string;
  expected: string;
  isCorrect: boolean;
  skill: string;
  subjectId: string;
  sectionId: string;
  moduleTitle: string;
  difficulty: Question["difficulty"];
  targetSeconds?: number;
  mistakeCategory?: MistakeCategory;
};
type TutorMessage = {
  role: "student" | "tutor";
  content: string;
  source?: string;
};
type StudyPacketKind = "formula-sheet" | "today-recall" | "weak-review";
type FlashcardConfidence = "again" | "got-it";
type BillingAction = "checkout" | "portal";
type AdminQuestionDraft = {
  subjectId: string;
  sectionId: string;
  difficulty: Question["difficulty"];
  questionType: "multipleChoice" | "numeric";
  prompt: string;
  skill: string;
  answer: string;
  choices: string[];
  numericAnswer: string;
  acceptableTolerance: string;
  units: string;
  formulaUsed: string;
  handbookKeywords: string;
  commonMistakes: string;
  solution: string;
  trap: string;
  repair: string;
};
type HealthConfig = {
  appUrl: boolean;
  firebaseClient: boolean;
  firebaseAdmin: boolean;
  stripe: boolean;
  aiTutor: boolean;
  previewMode: boolean;
};
type ReferenceItem = {
  id: string;
  subjectId: string;
  sectionId: string;
  moduleTitle: string;
  title: string;
  formula: string;
  note: string;
  keywords: string[];
  whenToUse: string;
  commonMistake: string;
  units?: string;
  relatedQuestionCount: number;
};
type FEModeResult = {
  questionId: string;
  submitted: string;
  expected: string;
  isCorrect: boolean;
};
type ReadinessStatus = {
  label: "Needs evidence" | "Weak" | "Developing" | "Nearly ready" | "Ready";
  tone: "empty" | "red" | "yellow" | "green";
};
type AttemptUpdate = {
  isCorrect: boolean;
  responseTimeSeconds: number;
  mistakeCategory?: MistakeCategory;
};

const DEFAULT_TARGET_SCORE = 70;
const MIN_READY_ATTEMPTS = 5;
const MIN_QUESTION_BANK_TARGET = 150;
const STRETCH_QUESTION_BANK_TARGET = 250;
const DISCIPLINE_LABELS: Record<FEDiscipline, string> = {
  mechanical: "FE Mechanical",
  civil: "FE Civil",
  "electrical-computer": "FE Electrical & Computer",
  environmental: "FE Environmental",
  chemical: "FE Chemical",
  "industrial-systems": "FE Industrial & Systems",
  "other-disciplines": "FE Other Disciplines",
};
const DISCIPLINE_SUBJECTS: Record<FEDiscipline, FESubject[]> = {
  mechanical: feMechanicalSubjects,
  civil: feCivilSubjects,
  "electrical-computer": feElectricalComputerSubjects,
  environmental: feEnvironmentalSubjects,
  chemical: feChemicalSubjects,
  "industrial-systems": feIndustrialSystemsSubjects,
  "other-disciplines": feOtherDisciplinesSubjects,
};
const DISCIPLINE_MODULES: Record<FEDiscipline, Record<string, StudyModule>> = {
  mechanical: moduleRegistry,
  civil: civilModuleRegistry,
  ...additionalModuleRegistries,
};
const DEFAULT_DIAGNOSTIC_SCORES = Object.fromEntries(feMechanicalSubjects.map((subject) => [subject.id, DEFAULT_TARGET_SCORE]));
const DEFAULT_ADMIN_DRAFT: AdminQuestionDraft = {
  subjectId: "math",
  sectionId: "trigonometry",
  difficulty: "Medium",
  questionType: "multipleChoice",
  prompt: "",
  skill: "",
  answer: "",
  choices: ["", "", "", ""],
  numericAnswer: "",
  acceptableTolerance: "",
  units: "",
  formulaUsed: "",
  handbookKeywords: "",
  commonMistakes: "",
  solution: "",
  trap: "",
  repair: "",
};

function getDefaultExamDate() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

function progressUpdatedMs(p?: Progress): number {
  return typeof p?.updatedAt?.toMillis === "function" ? p.updatedAt.toMillis!() : 0;
}

function daysUntil(dateValue: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${dateValue}T00:00:00`);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86400000));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateKeyFromOffset(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function calculateStudyStreak(progressMap: Record<string, Progress>) {
  const activeDays = new Set<string>();

  Object.values(progressMap).forEach((p) => {
    Object.entries(p.activeDays || {}).forEach(([date, active]) => {
      if (active) activeDays.add(date);
    });
  });

  if (activeDays.size === 0) {
    return Object.values(progressMap).some((p) => (p.attempts || 0) > 0) ? 1 : 0;
  }

  let streak = 0;
  for (let offset = 0; offset > -365; offset -= 1) {
    if (!activeDays.has(dateKeyFromOffset(offset))) break;
    streak += 1;
  }

  return streak;
}

function collectActiveDayKeys(progressMap: Record<string, Progress>) {
  const activeDays = new Set<string>();
  Object.values(progressMap).forEach((p) => {
    Object.entries(p.activeDays || {}).forEach(([date, active]) => {
      if (active) activeDays.add(date);
    });
  });
  return activeDays;
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }

  if (value !== null && typeof value === "object" && (value as object).constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) result[key] = stripUndefined(v);
    }
    return result as T;
  }

  return value;
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function questionExpectedAnswer(question: Question) {
  if (getQuestionType(question) === "numeric") {
    return `${question.numericAnswer ?? ""}${question.units ? ` ${question.units}` : ""}`;
  }

  return question.choices?.[question.answer ?? -1] || "";
}

function readinessStatus(score: number, attempts: number): ReadinessStatus {
  if (attempts < MIN_READY_ATTEMPTS) return { label: "Needs evidence", tone: "empty" };
  if (score < 50) return { label: "Weak", tone: "red" };
  if (score < 70) return { label: "Developing", tone: "yellow" };
  if (score < 80) return { label: "Nearly ready", tone: "yellow" };
  return { label: "Ready", tone: "green" };
}

function inferMistakeCategory(questionCommonMistakes?: string[]): MistakeCategory {
  const first = questionCommonMistakes?.[0];
  const categories: MistakeCategory[] = [
    "Concept misunderstanding",
    "Wrong formula",
    "Unit conversion",
    "Calculator error",
    "Arithmetic error",
    "Misread question",
    "Time management",
  ];
  return categories.find((category) => category === first) || "Concept misunderstanding";
}

function calculateMasteryScore(progress: Progress) {
  const attempts = progress.attempts || 0;
  if (!attempts) return 0;

  const lifetimeAccuracy = ((progress.correct || 0) / attempts) * 100;
  const recent = progress.recentResults?.slice(-10) || [];
  const recentAccuracy = recent.length ? (recent.filter(Boolean).length / recent.length) * 100 : lifetimeAccuracy;
  const avgTime = progress.averageResponseTimeSeconds || 180;
  const speedScore = Math.max(0, Math.min(100, 100 - Math.max(0, avgTime - 120) * 0.6));
  const severeMistakes =
    (progress.mistakeCategories?.["Concept misunderstanding"] || 0) +
    (progress.mistakeCategories?.["Wrong formula"] || 0) +
    (progress.mistakeCategories?.["Unit conversion"] || 0);
  const penalty = Math.min(18, severeMistakes * 3);
  const evidencePenalty = attempts < MIN_READY_ATTEMPTS ? 12 : 0;

  return Math.max(0, Math.min(100, Math.round(recentAccuracy * 0.65 + lifetimeAccuracy * 0.25 + speedScore * 0.1 - penalty - evidencePenalty)));
}

function previewProfile(): StudentProfile {
  return {
    uid: "preview",
    displayName: "Preview Student",
    discipline: "mechanical",
    examDate: getDefaultExamDate(),
    availableStudyHoursPerWeek: 8,
    diagnosticScores: DEFAULT_DIAGNOSTIC_SCORES,
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [previewMode, setPreviewMode] = useState(Boolean(process.env.NEXT_PUBLIC_PREVIEW_SKIP_AUTH));
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>("dashboard");
  const [subjectId, setSubjectId] = useState<string>("math");
  const [sectionId, setSectionId] = useState<string>("trigonometry");
  const [screen, setScreen] = useState<ModuleScreen>("home");
  const [qi, setQi] = useState(0);
  const [fi, setFi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashcardConfidence, setFlashcardConfidence] = useState<Record<string, FlashcardConfidence>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [gradeResult, setGradeResult] = useState<ReturnType<typeof gradeQuestion> | null>(null);
  const [checked, setChecked] = useState(false);
  const [showGuidedHint, setShowGuidedHint] = useState(false);
  const [referenceQuery, setReferenceQuery] = useState("");
  const [referenceCategory, setReferenceCategory] = useState("all");
  const [pinnedReferences, setPinnedReferences] = useState<Record<string, boolean>>({});
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [recallResults, setRecallResults] = useState<Record<string, "remembered" | "missed">>({});
  const [recallNotice, setRecallNotice] = useState("");
  const [errorNotebook, setErrorNotebook] = useState<Record<string, ErrorNotebookEntry>>({});
  const [errorFilterSkill, setErrorFilterSkill] = useState("all");
  const [errorFilterCategory, setErrorFilterCategory] = useState("all");
  const [mockSize, setMockSize] = useState<MockExamSize>(10);
  const [mockStarted, setMockStarted] = useState(false);
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<Record<string, MockExamAnswer>>({});
  const [mockFlags, setMockFlags] = useState<Record<string, boolean>>({});
  const [mockStartedAt, setMockStartedAt] = useState<number | null>(null);
  const [mockResults, setMockResults] = useState<MockExamResult[] | null>(null);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([
    { role: "tutor", content: "Ask me about the current topic. I will adapt to your mode, weak skills, mistakes, and exam date." },
  ]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [feIndex, setFeIndex] = useState(0);
  const [feSelected, setFeSelected] = useState<number | null>(null);
  const [feNumericAnswer, setFeNumericAnswer] = useState("");
  const [feResults, setFeResults] = useState<FEModeResult[]>([]);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [weak, setWeak] = useState<Record<string, number>>({});
  const [lessonIndex, setLessonIndex] = useState(0);
  const [practiceFilter, setPracticeFilter] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingBusy, setBillingBusy] = useState<BillingAction | null>(null);
  const [billingNotice, setBillingNotice] = useState("");
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [institutionCode, setInstitutionCode] = useState("");
  const [institutionNotice, setInstitutionNotice] = useState("");
  const [institutionBusy, setInstitutionBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDraft, setAdminDraft] = useState<AdminQuestionDraft>(DEFAULT_ADMIN_DRAFT);
  const [adminNotice, setAdminNotice] = useState("");
  const [completedPlanItems, setCompletedPlanItems] = useState<Record<string, boolean>>({});
  const [savedDailyPlan, setSavedDailyPlan] = useState<SavedDailyPlan | null>(null);
  const [plannerNotice, setPlannerNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [healthConfig, setHealthConfig] = useState<HealthConfig | null>(null);
  const [targetScore, setTargetScore] = useState(DEFAULT_TARGET_SCORE);
  const [examDate, setExamDate] = useState(getDefaultExamDate);
  const [calculatorScores, setCalculatorScores] = useState<CalculatorScores>(() =>
    DEFAULT_DIAGNOSTIC_SCORES,
  );
  const resumedRef = useRef<string | null>(null);
  const questionStartedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => void registration.unregister());
    });
    if ("caches" in window) {
      void caches.keys().then((keys) => keys.forEach((key) => void caches.delete(key)));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.config) setHealthConfig(data.config as HealthConfig);
      })
      .catch(() => {
        if (!cancelled) setHealthConfig(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setProgressMap({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setSaveError("");
        const snap = await getDocs(collection(db!, "users", user.uid, "progress"));
        if (cancelled) return;

        const map: Record<string, Progress> = {};
        snap.forEach((d) => {
          map[d.id] = d.data() as Progress;
        });
        setProgressMap(map);

        if (resumedRef.current !== user.uid) {
          resumedRef.current = user.uid;
          let latestId: string | null = null;
          let latestMs = -1;

          Object.entries(map).forEach(([moduleId, p]) => {
            const ms = progressUpdatedMs(p);
            if ((p.attempts || 0) > 0 && ms >= latestMs) {
              latestMs = ms;
              latestId = moduleId;
            }
          });

          if (latestId) {
            const p = map[latestId];
            if (p.subjectId && p.sectionId && Object.values(DISCIPLINE_MODULES).some((registry) => registry[`${p.subjectId}:${p.sectionId}`])) {
              setSubjectId(p.subjectId);
              setSectionId(p.sectionId);
            }
          }
        }
      } catch {
        if (!cancelled) setSaveError("Progress could not be loaded. You can still practice, but Firestore access should be checked.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (previewMode) {
        const p = previewProfile();
        setProfile(p);
        setExamDate(p.examDate || getDefaultExamDate());
        setCalculatorScores(p.diagnosticScores);
      } else {
        setProfile(null);
      }
      setProfileLoading(false);
      return;
    }

    if (!db) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError("Firebase is not configured yet, so your student profile cannot be loaded.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setProfileLoading(true);
        setProfileError("");
        const snap = await getDoc(doc(db!, "profiles", user.uid));
        if (cancelled) return;

        if (!snap.exists()) {
          setProfile(null);
          return;
        }

        const p = snap.data() as StudentProfile;
        setProfile(p);
        setExamDate(p.examDate || getDefaultExamDate());
        setCalculatorScores({ ...DEFAULT_DIAGNOSTIC_SCORES, ...(p.diagnosticScores || {}) });
      } catch {
        if (!cancelled) setProfileError("Your profile could not be loaded. Please check Firestore access and try again.");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewMode, user]);

  useEffect(() => {
    const institutionId = profile?.institutionId;

    if (!institutionId || !db) {
      setInstitution(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db!, "institutions", institutionId));
        if (cancelled) return;
        setInstitution(snap.exists() ? { id: snap.id, ...snap.data() } as Institution : null);
      } catch {
        if (!cancelled) setInstitution(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.institutionId]);

  useEffect(() => {
    if (!profile) {
      setCompletedPlanItems({});
      setSavedDailyPlan(null);
      return;
    }

    if (!user || !db) {
      setCompletedPlanItems({});
      setSavedDailyPlan(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db!, "studyPlans", user.uid, "days", todayKey()));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as SavedDailyPlan;
          setSavedDailyPlan(data);
          setCompletedPlanItems(data.completed || {});
        } else {
          setSavedDailyPlan(null);
          setCompletedPlanItems({});
        }
      } catch {
        if (!cancelled) setProfileError("Today's plan could not be loaded. You can still use the dashboard.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, user]);

  useEffect(() => {
    if (!user || !db) {
      setErrorNotebook({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const snap = await getDocs(collection(db!, "errorLogs", user.uid, "items"));
        if (cancelled) return;
        const entries: Record<string, ErrorNotebookEntry> = {};
        snap.forEach((item) => {
          entries[item.id] = item.data() as ErrorNotebookEntry;
        });
        setErrorNotebook(entries);
      } catch {
        if (!cancelled) setSaveError("Error notebook could not be loaded from Firestore.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !db) {
      setSubscription(previewMode ? {
        uid: "preview",
        tier: "free",
        status: "incomplete",
      } : null);
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [tokenResult, subscriptionSnap] = await Promise.all([
          getIdTokenResult(user),
          getDoc(doc(db!, "subscriptions", user.uid)),
        ]);
        if (cancelled) return;

        setIsAdmin(tokenResult.claims.admin === true);
        setSubscription(subscriptionSnap.exists() ? subscriptionSnap.data() as Subscription : {
          uid: user.uid,
          tier: "free",
          status: "incomplete",
        });
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setSubscription({
            uid: user.uid,
            tier: "free",
            status: "incomplete",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewMode, user]);

  const activeDiscipline: FEDiscipline = profile?.discipline || "mechanical";
  const disciplineLabel = DISCIPLINE_LABELS[activeDiscipline];
  const activeSubjects = DISCIPLINE_SUBJECTS[activeDiscipline];
  const activeModuleRegistry = DISCIPLINE_MODULES[activeDiscipline];
  const activeTotalPlannedSections = activeSubjects.reduce((sum, item) => sum + item.sections.length, 0);
  const activeModule = activeModuleRegistry[`${subjectId}:${sectionId}`] || Object.values(activeModuleRegistry)[0] || moduleRegistry["math:trigonometry"];
  useEffect(() => {
    const currentSubject = activeSubjects.find((item) => item.id === subjectId);
    if (currentSubject?.sections.some((section) => section.id === sectionId)) return;

    const firstSubject = activeSubjects[0];
    setSubjectId(firstSubject.id);
    setSectionId(firstSubject.sections[0]?.id || "");
  }, [activeSubjects, sectionId, subjectId]);
  const adminSubject = activeSubjects.find((item) => item.id === adminDraft.subjectId) || activeSubjects[0];
  const adminSections = adminSubject.sections;
  const adminDraftReady = Boolean(
    adminDraft.prompt.trim() &&
    adminDraft.skill.trim() &&
    adminDraft.solution.trim() &&
    adminDraft.repair.trim() &&
    (
      adminDraft.questionType === "numeric"
        ? adminDraft.numericAnswer.trim() && Number.isFinite(Number(adminDraft.numericAnswer))
        : adminDraft.choices.filter((choice) => choice.trim()).length >= 2 && adminDraft.answer.trim()
    ),
  );
  const practiceQuestions = practiceFilter ? activeModule.questions.filter((question) => question.skill === practiceFilter) : activeModule.questions;
  const q = practiceQuestions[qi] || activeModule.questions[0];
  const qType = getQuestionType(q);
  const feQuestions = useMemo(() => activeModule.questions.slice(0, Math.min(5, activeModule.questions.length)), [activeModule.questions]);
  const feQuestion = feQuestions[feIndex] || feQuestions[0] || q;
  const feQuestionType = getQuestionType(feQuestion);
  const feComplete = feResults.length >= feQuestions.length && feQuestions.length > 0;
  const feScore = feQuestions.length ? Math.round((feResults.filter((result) => result.isCorrect).length / feQuestions.length) * 100) : 0;
  const mockQuestionPool = useMemo(() => {
    const active = activeModule.questions.map((question) => ({ question, module: activeModule }));
    const broader = Object.values(activeModuleRegistry).flatMap((mod) => mod.questions.map((question) => ({ question, module: mod })));
    const deduped = Array.from(new Map([...active, ...broader].map((item) => [item.question.id, item])).values());
    return deduped;
  }, [activeModule, activeModuleRegistry]);
  const mockQuestions = useMemo(() => mockQuestionPool.slice(0, Math.min(mockSize, mockQuestionPool.length)), [mockQuestionPool, mockSize]);
  const mockCurrent = mockQuestions[mockCurrentIndex];
  const mockElapsedSeconds = mockStartedAt ? Math.max(0, Math.round((Date.now() - mockStartedAt) / 1000)) : 0;
  const mockAllowedSeconds = mockSize * 180;
  const mockScore = mockResults?.length ? Math.round((mockResults.filter((result) => result.isCorrect).length / mockResults.length) * 100) : 0;
  const mockWeakSkills = useMemo(() => {
    return Object.entries((mockResults || []).reduce<Record<string, number>>((acc, result) => {
      if (!result.isCorrect) acc[result.skill] = (acc[result.skill] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [mockResults]);
  const mockMistakeCategories = useMemo(() => {
    return Object.entries((mockResults || []).reduce<Record<string, number>>((acc, result) => {
      if (result.mistakeCategory) acc[result.mistakeCategory] = (acc[result.mistakeCategory] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
  }, [mockResults]);
  const mockReviewSummary = useMemo(() => {
    const results = mockResults || [];
    const subjectRows = Object.entries(results.reduce<Record<string, { correct: number; total: number; missed: number }>>((acc, result) => {
      const subjectTitle = activeSubjects.find((item) => item.id === result.subjectId)?.title || result.subjectId;
      acc[subjectTitle] ||= { correct: 0, total: 0, missed: 0 };
      acc[subjectTitle].total += 1;
      if (result.isCorrect) acc[subjectTitle].correct += 1;
      else acc[subjectTitle].missed += 1;
      return acc;
    }, {})).map(([subjectTitle, row]) => ({
      subjectTitle,
      ...row,
      percent: row.total ? Math.round((row.correct / row.total) * 100) : 0,
    })).sort((a, b) => a.percent - b.percent);
    const unanswered = results.filter((result) => result.submitted === "No answer" || result.submitted === "No numeric answer").length;
    const flaggedMisses = results.filter((result) => !result.isCorrect && mockFlags[result.questionId]).length;
    const retestTarget = results.find((result) => !result.isCorrect) || results.find((result) => result.mistakeCategory);
    const totalTargetSeconds = results.reduce((sum, result) => sum + (result.targetSeconds || 180), 0);

    return { subjectRows, unanswered, flaggedMisses, retestTarget, totalTargetSeconds };
  }, [activeSubjects, mockFlags, mockResults]);
  const activeProgress = progressMap[activeModule.id];
  const mastery = activeProgress?.mastery ?? calculateMasteryScore({
    correct,
    attempts,
    weakSkills: weak,
    recentResults: activeProgress?.recentResults,
    mistakeCategories: activeProgress?.mistakeCategories,
    averageResponseTimeSeconds: activeProgress?.averageResponseTimeSeconds,
  });
  const subject = activeSubjects.find((s) => s.id === subjectId) || activeSubjects[0];
  const weakest = useMemo(() => Object.entries(weak).sort((a, b) => b[1] - a[1])[0]?.[0] || "No weakness detected yet", [weak]);
  const liveModules = Object.keys(activeModuleRegistry).length;
  const sectionCompletion = Math.round((liveModules / activeTotalPlannedSections) * 100);

  const subjectStats = useMemo(() => {
    return activeSubjects.map((s) => {
      const liveSections = s.sections.filter((sec) => activeModuleRegistry[`${s.id}:${sec.id}`]);
      let correctSum = 0;
      let attemptsSum = 0;
      let completedCount = 0;
      let currentSection: FESection | null = null;
      let currentModule: StudyModule | null = null;
      let latestMs = -1;

      liveSections.forEach((sec) => {
        const mod = activeModuleRegistry[`${s.id}:${sec.id}`];
        const p = progressMap[mod.id];
        const c = p?.correct || 0;
        const a = p?.attempts || 0;
        correctSum += c;
        attemptsSum += a;
        if (a >= mod.questions.length) completedCount += 1;
        if (a > 0) {
          const ms = progressUpdatedMs(p);
          if (ms >= latestMs) {
            latestMs = ms;
            currentSection = sec;
            currentModule = mod;
          }
        }
      });

      if (!currentSection) {
        const nextUnstarted = liveSections.find((sec) => {
          const mod = activeModuleRegistry[`${s.id}:${sec.id}`];
          return (progressMap[mod.id]?.attempts || 0) < mod.questions.length;
        }) || liveSections[0];
        currentSection = nextUnstarted || null;
        currentModule = nextUnstarted ? activeModuleRegistry[`${s.id}:${nextUnstarted.id}`] : null;
      }

      const percent = attemptsSum ? Math.round((correctSum / attemptsSum) * 100) : 0;

      const status = readinessStatus(percent, attemptsSum);

      return { subject: s, liveSections, percent, attemptsSum, completedCount, totalLive: liveSections.length, currentSection, currentModule, status };
    });
  }, [activeModuleRegistry, activeSubjects, progressMap]);

  const coverageStats = useMemo(() => {
    const rows = activeSubjects.map((subj) => {
      const sections = subj.sections.map((section) => {
        const mod = activeModuleRegistry[`${subj.id}:${section.id}`];
        const lessons = mod?.lessons.length || 0;
        const formulas = mod?.flashcards.length || 0;
        const questions = mod?.questions.length || 0;
        const hasModule = Boolean(mod);
        const completeSignals = [lessons > 0, formulas > 0, questions >= 5];
        const percent = hasModule ? Math.round((completeSignals.filter(Boolean).length / completeSignals.length) * 100) : 0;

        return {
          subjectId: subj.id,
          sectionId: section.id,
          title: section.title,
          hasModule,
          lessons,
          formulas,
          questions,
          percent,
          status: !hasModule ? "Not started" : percent === 100 ? "Ready" : "Partial",
        };
      });
      const live = sections.filter((section) => section.hasModule).length;
      const ready = sections.filter((section) => section.percent === 100).length;
      const lessons = sections.reduce((sum, section) => sum + section.lessons, 0);
      const formulas = sections.reduce((sum, section) => sum + section.formulas, 0);
      const questions = sections.reduce((sum, section) => sum + section.questions, 0);
      const percent = Math.round(sections.reduce((sum, section) => sum + section.percent, 0) / Math.max(1, sections.length));

      return { subject: subj, sections, live, ready, lessons, formulas, questions, percent };
    });
    const totalSections = rows.reduce((sum, row) => sum + row.sections.length, 0);
    const liveSections = rows.reduce((sum, row) => sum + row.live, 0);
    const readySections = rows.reduce((sum, row) => sum + row.ready, 0);

    return {
      rows,
      totalSections,
      liveSections,
      readySections,
      totalQuestions: rows.reduce((sum, row) => sum + row.questions, 0),
      totalFormulas: rows.reduce((sum, row) => sum + row.formulas, 0),
      totalLessons: rows.reduce((sum, row) => sum + row.lessons, 0),
      percent: Math.round((readySections / Math.max(1, totalSections)) * 100),
    };
  }, [activeModuleRegistry, activeSubjects]);

  const questionBankStats = useMemo(() => {
    const disciplines = Object.entries(DISCIPLINE_LABELS).map(([discipline, label]) => {
      const registry = DISCIPLINE_MODULES[discipline as FEDiscipline];
      const subjects = DISCIPLINE_SUBJECTS[discipline as FEDiscipline];
      const modules = Object.values(registry);
      const questions = modules.reduce((sum, module) => sum + module.questions.length, 0);
      const connectedSections = modules.length;
      const totalSections = subjects.reduce((sum, item) => sum + item.sections.length, 0);
      const minimumPercent = Math.min(100, Math.round((questions / MIN_QUESTION_BANK_TARGET) * 100));
      const stretchPercent = Math.min(100, Math.round((questions / STRETCH_QUESTION_BANK_TARGET) * 100));

      return {
        discipline: discipline as FEDiscipline,
        label,
        questions,
        modules: modules.length,
        connectedSections,
        totalSections,
        minimumPercent,
        stretchPercent,
        minimumRemaining: Math.max(0, MIN_QUESTION_BANK_TARGET - questions),
        stretchRemaining: Math.max(0, STRETCH_QUESTION_BANK_TARGET - questions),
      };
    });
    const active = disciplines.find((item) => item.discipline === activeDiscipline) || disciplines[0];
    const totalQuestions = disciplines.reduce((sum, item) => sum + item.questions, 0);

    return { active, disciplines, totalQuestions };
  }, [activeDiscipline]);

  const overallProgress = useMemo(() => {
    let c = 0;
    let a = 0;
    Object.values(progressMap).forEach((p) => {
      c += p.correct || 0;
      a += p.attempts || 0;
    });
    const percent = a ? Math.round((c / a) * 100) : 0;
    return { percent, attempts: a, status: readinessStatus(percent, a) };
  }, [progressMap]);

  const dashboardMetrics = useMemo(() => {
    const accuracy = overallProgress.percent;
    const days = daysUntil(examDate);
    const questionsCompleted = overallProgress.attempts;
    const studyStreak = calculateStudyStreak(progressMap);
    const totalTime = Object.values(progressMap).reduce((sum, p) => sum + (p.totalResponseTimeSeconds || 0), 0);
    const estimatedAverageTime = questionsCompleted > 0 ? Math.round(totalTime / questionsCompleted) : 0;
    const strongest = subjectStats
      .filter((stat) => stat.attemptsSum >= MIN_READY_ATTEMPTS)
      .slice()
      .sort((a, b) => b.percent - a.percent)[0]?.subject.title || "Build a baseline";
    const weakestSubject = subjectStats
      .filter((stat) => stat.attemptsSum > 0)
      .slice()
      .sort((a, b) => a.percent - b.percent)[0]?.subject.title || "Diagnostic needed";

    return { accuracy, days, questionsCompleted, studyStreak, estimatedAverageTime, strongest, weakestSubject };
  }, [examDate, overallProgress, progressMap, subjectStats]);

  const studyActivity = useMemo(() => {
    const activeDays = collectActiveDayKeys(progressMap);
    const days = Array.from({ length: 14 }, (_item, index) => {
      const offset = index - 13;
      const key = dateKeyFromOffset(offset);
      const label = new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
      return { key, label, active: activeDays.has(key), isToday: offset === 0 };
    });
    const activeThisWeek = days.slice(-7).filter((day) => day.active).length;
    const weeklyGoal = Math.min(7, Math.max(3, Math.ceil((profile?.availableStudyHoursPerWeek || 8) / 2)));

    return {
      days,
      activeThisWeek,
      weeklyGoal,
      weeklyPercent: Math.min(100, Math.round((activeThisWeek / weeklyGoal) * 100)),
    };
  }, [profile, progressMap]);

  const dashboardPriorities = useMemo(() => {
    return subjectStats
      .map((stat) => {
        const diagnostic = calculatorScores[stat.subject.id] ?? DEFAULT_TARGET_SCORE;
        const weight = (stat.subject.examQuestionRange[0] + stat.subject.examQuestionRange[1]) / 2;
        const evidencePenalty = stat.attemptsSum < MIN_READY_ATTEMPTS ? 12 : 0;
        const performanceScore = stat.attemptsSum > 0 ? stat.percent : diagnostic;
        const weakness = Math.max(0, 100 - Math.min(diagnostic, performanceScore));
        const priority = Math.round(weight * (weakness + evidencePenalty));

        return { ...stat, diagnostic, weight, priority };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [calculatorScores, subjectStats]);

  const lastVisitedModuleId = useMemo(() => {
    let id: string | null = null;
    let latestMs = -1;
    Object.entries(progressMap).forEach(([moduleId, p]) => {
      const ms = progressUpdatedMs(p);
      if ((p.attempts || 0) > 0 && ms >= latestMs) {
        latestMs = ms;
        id = moduleId;
      }
    });
    return id;
  }, [progressMap]);

  const continueModule = useMemo(() => {
    if (lastVisitedModuleId) {
      const found = Object.values(activeModuleRegistry).find((m) => m.id === lastVisitedModuleId);
      if (found) return found;
    }
    return Object.values(activeModuleRegistry)[0] || moduleRegistry["math:trigonometry"];
  }, [activeModuleRegistry, lastVisitedModuleId]);

  const continueLessonIdx = Math.min(progressMap[continueModule.id]?.lessonIndex || 0, continueModule.lessons.length - 1);
  const continueLessonTitle = continueModule.lessons[continueLessonIdx]?.title || continueModule.lessons[0].title;

  const globalWeakSkills = useMemo(() => {
    const rows: { moduleId: string; subjectId: string; sectionId: string; moduleTitle: string; skill: string; count: number }[] = [];

    Object.entries(progressMap).forEach(([moduleId, p]) => {
      if (!p.weakSkills || !p.subjectId || !p.sectionId) return;
      const mod = activeModuleRegistry[`${p.subjectId}:${p.sectionId}`];
      if (!mod) return;

      Object.entries(p.weakSkills).forEach(([skill, count]) => {
        if (count > 0) rows.push({ moduleId, subjectId: p.subjectId!, sectionId: p.sectionId!, moduleTitle: mod.title, skill, count });
      });
    });

    return rows.sort((a, b) => b.count - a.count).slice(0, 8);
  }, [activeModuleRegistry, progressMap]);

  const adaptiveInsights = useMemo(() => {
    const moduleRows = Object.entries(progressMap)
      .map(([moduleId, p]) => {
        const studyModule = Object.values(activeModuleRegistry).find((item) => item.id === moduleId);
        if (!studyModule) return null;
        const attemptsCount = p.attempts || 0;
        const accuracy = attemptsCount ? Math.round(((p.correct || 0) / attemptsCount) * 100) : 0;
        return {
          module: studyModule,
          attempts: attemptsCount,
          accuracy,
          avgTime: Math.round(p.averageResponseTimeSeconds || 0),
          mastery: p.mastery ?? calculateMasteryScore(p),
        };
      })
      .filter(Boolean) as { module: StudyModule; attempts: number; accuracy: number; avgTime: number; mastery: number }[];

    const topMistakes = Object.values(progressMap).reduce<Partial<Record<MistakeCategory, number>>>((acc, p) => {
      Object.entries(p.mistakeCategories || {}).forEach(([category, count]) => {
        const key = category as MistakeCategory;
        acc[key] = (acc[key] || 0) + (count || 0);
      });
      return acc;
    }, {});

    const mistakeRows = Object.entries(topMistakes)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 3) as [MistakeCategory, number][];

    const slowest = moduleRows
      .filter((row) => row.avgTime > 0)
      .sort((a, b) => b.avgTime - a.avgTime)[0];
    const evidenceGap = dashboardPriorities.find((item) => item.attemptsSum < MIN_READY_ATTEMPTS && item.currentModule);
    const repair = globalWeakSkills[0];
    const retest = moduleRows
      .filter((row) => row.attempts >= MIN_READY_ATTEMPTS)
      .sort((a, b) => a.mastery - b.mastery)[0];

    return {
      mistakeRows,
      slowest,
      evidenceGap,
      repair,
      retest,
      dataState: overallProgress.attempts < MIN_READY_ATTEMPTS ? "baseline" : "adaptive",
    };
  }, [activeModuleRegistry, dashboardPriorities, globalWeakSkills, overallProgress.attempts, progressMap]);

  const recallItems = useMemo<RecallItem[]>(() => {
    const items: RecallItem[] = [];

    globalWeakSkills.slice(0, 4).forEach((row) => {
      const mod = activeModuleRegistry[`${row.subjectId}:${row.sectionId}`];
      const question = mod?.questions.find((item) => item.skill === row.skill);
      if (!mod || !question) return;
      items.push({
        id: `missed:${row.moduleId}:${row.skill}`,
        prompt: `Recall repair step for: ${row.skill}`,
        answer: question.repair || question.explanation,
        source: row.moduleTitle,
        subjectId: row.subjectId,
        sectionId: row.sectionId,
        skill: row.skill,
        dueReason: "missed",
      });
    });

    continueModule.flashcards.slice(0, 4).forEach((card, index) => {
      items.push({
        id: `formula:${continueModule.id}:${index}`,
        prompt: card.front,
        answer: `${card.back}. ${card.note}`,
        source: continueModule.title,
        subjectId: continueModule.subjectId,
        sectionId: continueModule.sectionId,
        dueReason: "formula",
      });
    });

    dashboardPriorities
      .filter((item) => item.attemptsSum < MIN_READY_ATTEMPTS && item.currentModule)
      .slice(0, 2)
      .forEach((item) => {
        items.push({
          id: `stale:${item.currentModule!.id}`,
          prompt: `What is the first thing to check in ${item.currentModule!.title}?`,
          answer: item.currentModule!.lessons[0]?.body || "Review the core concept and units before calculating.",
          source: item.subject.title,
          subjectId: item.subject.id,
          sectionId: item.currentModule!.sectionId,
          dueReason: "stale",
        });
      });

    const deduped = Array.from(new Map(items.map((item) => [item.id, item])).values());
    return deduped.slice(0, Math.min(10, Math.max(3, deduped.length)));
  }, [activeModuleRegistry, continueModule, dashboardPriorities, globalWeakSkills]);

  const currentRecallItem = recallItems[recallIndex] || recallItems[0];
  const recallComplete = recallItems.length > 0 && Object.keys(recallResults).length >= recallItems.length;
  const recallRemembered = Object.values(recallResults).filter((result) => result === "remembered").length;
  const activeFlashcardId = `${activeModule.id}_${fi}`;
  const activeFlashcardConfidence = flashcardConfidence[activeFlashcardId];
  const activeReferenceItems = useMemo<ReferenceItem[]>(() => {
    return activeModule.flashcards.map((card, index) => {
      const relatedQuestions = activeModule.questions.filter((question) => {
        const haystack = [
          question.skill,
          question.formulaUsed,
          ...(question.handbookKeywords || []),
        ].join(" ").toLowerCase();
        return haystack.includes(card.front.toLowerCase()) || haystack.includes(card.back.toLowerCase().split("=")[0].trim());
      });
      const firstRelated = relatedQuestions[0];

      return {
        id: `${activeModule.id}:ref:${index}`,
        subjectId: activeModule.subjectId,
        sectionId: activeModule.sectionId,
        moduleTitle: activeModule.title,
        title: card.front,
        formula: card.back,
        note: card.note,
        keywords: Array.from(new Set(relatedQuestions.flatMap((question) => question.handbookKeywords || []))).slice(0, 6),
        whenToUse: firstRelated?.skill || card.note,
        commonMistake: firstRelated?.trap || firstRelated?.commonMistakes?.[0] || "Check units and solve for the requested variable before substituting.",
        units: firstRelated?.units,
        relatedQuestionCount: relatedQuestions.length,
      };
    });
  }, [activeModule]);
  const referenceCategories = useMemo(() => {
    return ["all", "pinned", ...Array.from(new Set(activeReferenceItems.map((item) => item.moduleTitle)))];
  }, [activeReferenceItems]);
  const filteredReferenceItems = useMemo(() => {
    const query = referenceQuery.trim().toLowerCase();
    const categoryFiltered = activeReferenceItems.filter((item) => {
      if (referenceCategory === "all") return true;
      if (referenceCategory === "pinned") return Boolean(pinnedReferences[item.id]);
      return item.moduleTitle === referenceCategory;
    });
    if (!query) return categoryFiltered;

    return categoryFiltered.filter((item) => [
      item.title,
      item.formula,
      item.note,
      item.moduleTitle,
      item.whenToUse,
      item.commonMistake,
      item.units,
      ...item.keywords,
    ].join(" ").toLowerCase().includes(query));
  }, [activeReferenceItems, pinnedReferences, referenceCategory, referenceQuery]);
  const errorRows = useMemo(() => {
    return Object.values(errorNotebook)
      .filter((entry) => errorFilterSkill === "all" || entry.skill === errorFilterSkill)
      .filter((entry) => errorFilterCategory === "all" || entry.mistakeCategory === errorFilterCategory)
      .sort((a, b) => b.repeatedMistakes - a.repeatedMistakes);
  }, [errorFilterCategory, errorFilterSkill, errorNotebook]);
  const errorSkills = useMemo(() => Array.from(new Set(Object.values(errorNotebook).map((entry) => entry.skill))).sort(), [errorNotebook]);
  const errorCategories = useMemo(() => Array.from(new Set(Object.values(errorNotebook).map((entry) => entry.mistakeCategory))).sort(), [errorNotebook]);
  const weakPacketQuestions = useMemo(() => {
    const weakSkills = new Set([
      ...globalWeakSkills.map((item) => item.skill),
      ...Object.values(errorNotebook).map((item) => item.skill),
    ]);
    const matching = Object.values(activeModuleRegistry)
      .flatMap((mod) => mod.questions.map((question) => ({ module: mod, question })))
      .filter(({ question }) => weakSkills.has(question.skill));

    return (matching.length ? matching : activeModule.questions.map((question) => ({ module: activeModule, question }))).slice(0, 8);
  }, [activeModule, activeModuleRegistry, errorNotebook, globalWeakSkills]);

  const todayPlan = useMemo<DailyPlanActivity[]>(() => {
    const primary = dashboardPriorities.find((item) => item.currentModule) || dashboardPriorities[0];
    const secondary = dashboardPriorities.find((item) => item.subject.id !== primary?.subject.id && item.currentModule);
    const repair = globalWeakSkills[0];
    const planMinutes = Math.max(30, Math.round(((profile?.availableStudyHoursPerWeek || 8) * 60) / 6));
    const guidedMinutes = Math.max(10, Math.round(planMinutes * 0.3));
    const feMinutes = Math.max(10, Math.round(planMinutes * 0.25));
    const lessonModule = primary?.currentModule || continueModule;
    const secondaryModule = secondary?.currentModule || continueModule;
    const primaryPriority = primary?.priority || 0;
    const primaryRationale = `Priority ${primaryPriority}: diagnostic ${primary?.diagnostic ?? DEFAULT_TARGET_SCORE}%, exam weight ${primary?.weight ?? 0}, attempts ${primary?.attemptsSum ?? 0}.`;

    return [
      {
        id: "recall",
        kind: "recall",
        title: "Recall warm-up",
        detail: repair ? `Review missed skill: ${repair.skill}` : `Review formulas from ${continueLessonTitle}`,
        minutes: 8,
        subjectId: repair?.subjectId || continueModule.subjectId,
        sectionId: repair?.sectionId || continueModule.sectionId,
        skill: repair?.skill,
        priorityScore: repair ? 95 : 55,
        rationale: repair ? `Repeated miss count: ${repair.count}` : "Warm-up from the last active lesson.",
      },
      {
        id: "lesson",
        kind: "lesson",
        title: `Learn: ${lessonModule.title}`,
        detail: `${primary?.subject.title || "Mathematics"} is high priority from diagnostics, attempts, and exam weighting.`,
        minutes: Math.max(12, Math.round(planMinutes * 0.25)),
        subjectId: lessonModule.subjectId,
        sectionId: lessonModule.sectionId,
        priorityScore: primaryPriority,
        rationale: primaryRationale,
      },
      {
        id: "guided",
        kind: "guided",
        title: "Guided practice",
        detail: repair ? `Target ${repair.skill} before moving to mixed work.` : `Build evidence in ${lessonModule.title}.`,
        minutes: guidedMinutes,
        subjectId: repair?.subjectId || lessonModule.subjectId,
        sectionId: repair?.sectionId || lessonModule.sectionId,
        skill: repair?.skill,
        priorityScore: repair ? 90 : primaryPriority,
        rationale: repair ? `Weak skill repair from ${repair.moduleTitle}.` : primaryRationale,
      },
      {
        id: "fe",
        kind: "fe",
        title: "FE-style practice",
        detail: `Work without hints in ${secondaryModule.title}.`,
        minutes: feMinutes,
        subjectId: secondaryModule.subjectId,
        sectionId: secondaryModule.sectionId,
        priorityScore: secondary?.priority || Math.max(40, primaryPriority - 10),
        rationale: secondary ? `Secondary priority: ${secondary.subject.title}.` : "Mixed FE-style practice from current module.",
      },
      {
        id: "review",
        kind: "review",
        title: "Error review",
        detail: repair ? `Write down why ${repair.skill} was missed.` : "Log any formula, unit, or arithmetic mistakes from today.",
        minutes: 7,
        subjectId: repair?.subjectId || lessonModule.subjectId,
        sectionId: repair?.sectionId || lessonModule.sectionId,
        skill: repair?.skill,
        priorityScore: repair ? 85 : 45,
        rationale: repair ? `Capture why ${repair.skill} was missed.` : "Prepare future error notebook data.",
      },
    ];
  }, [continueLessonTitle, continueModule, dashboardPriorities, globalWeakSkills, profile]);

  const plannerSignature = useMemo(() => {
    const top = dashboardPriorities.slice(0, 3).map((item) => `${item.subject.id}:${item.priority}:${item.percent}:${item.attemptsSum}`).join("|");
    const weakSig = globalWeakSkills.slice(0, 3).map((item) => `${item.moduleId}:${item.skill}:${item.count}`).join("|");
    return [todayKey(), examDate, profile?.availableStudyHoursPerWeek || 0, overallProgress.attempts, top, weakSig].join("::");
  }, [dashboardPriorities, examDate, globalWeakSkills, overallProgress.attempts, profile]);

  const displayPlan = savedDailyPlan?.signature === plannerSignature ? savedDailyPlan.activities : todayPlan;

  const todayPlanProgress = useMemo(() => {
    const done = displayPlan.filter((item) => completedPlanItems[item.id]).length;
    return { done, total: displayPlan.length, percent: displayPlan.length ? Math.round((done / displayPlan.length) * 100) : 0 };
  }, [completedPlanItems, displayPlan]);

  useEffect(() => {
    if (!profile) return;
    if (savedDailyPlan?.signature === plannerSignature) return;

    const nextCompleted = Object.fromEntries(todayPlan.map((item) => [item.id, completedPlanItems[item.id] || false]));
    const nextPlan: SavedDailyPlan = {
      date: todayKey(),
      activities: todayPlan,
      completed: nextCompleted,
      signature: plannerSignature,
    };

    setSavedDailyPlan(nextPlan);
    setCompletedPlanItems(nextCompleted);
    setPlannerNotice(savedDailyPlan ? "Today's plan adjusted after your latest profile or practice changes." : "Today's plan generated from your current profile and progress.");

    if (!user || !db) return;

    void setDoc(doc(db, "studyPlans", user.uid, "days", todayKey()), stripUndefined({
      ...nextPlan,
      generatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }), { merge: true }).catch(() => {
      setPlannerNotice("Today's plan was generated locally, but could not be saved to Firestore.");
    });
  }, [completedPlanItems, plannerSignature, profile, savedDailyPlan, todayPlan, user]);

  useEffect(() => {
    setQi(0);
    setFi(0);
    setSelected(null);
    setNumericAnswer("");
    setGradeResult(null);
    setShowGuidedHint(false);
    setRecallIndex(0);
    setRecallRevealed(false);
    setRecallResults({});
    setRecallNotice("");
    setShowHandbook(false);
    setFeIndex(0);
    setFeSelected(null);
    setFeNumericAnswer("");
    setFeResults([]);
    setChecked(false);
    setFlipped(false);
    questionStartedAtRef.current = Date.now();
  }, [activeModule.id, practiceFilter]);

  useEffect(() => {
    const p = progressMap[activeModule.id];
    setCorrect(p?.correct || 0);
    setAttempts(p?.attempts || 0);
    setWeak(p?.weakSkills || {});
    setLessonIndex(p?.lessonIndex || 0);
  }, [activeModule.id, progressMap]);

  async function saveProgress(nc: number, na: number, nw: Record<string, number>, li: number, attempt?: AttemptUpdate) {
    const previous = progressMap[activeModule.id] || {};
    const recentResults = attempt ? [...(previous.recentResults || []), attempt.isCorrect].slice(-10) : previous.recentResults || [];
    const totalResponseTimeSeconds = (previous.totalResponseTimeSeconds || 0) + (attempt?.responseTimeSeconds || 0);
    const averageResponseTimeSeconds = na ? Math.round(totalResponseTimeSeconds / na) : 0;
    const mistakeCategories = { ...(previous.mistakeCategories || {}) };

    if (attempt?.mistakeCategory && !attempt.isCorrect) {
      mistakeCategories[attempt.mistakeCategory] = (mistakeCategories[attempt.mistakeCategory] || 0) + 1;
    }

    const nextProgress: Progress = {
      correct: nc,
      attempts: na,
      weakSkills: nw,
      mistakeCategories,
      recentResults,
      lessonIndex: li,
      subjectId: activeModule.subjectId,
      sectionId: activeModule.sectionId,
      averageResponseTimeSeconds,
      totalResponseTimeSeconds,
      activeDays: { ...(previous.activeDays || {}), [todayKey()]: true },
      updatedAt: { toMillis: () => Date.now() },
    };
    const moduleMastery = calculateMasteryScore(nextProgress);
    nextProgress.mastery = moduleMastery;

    setProgressMap((prev) => ({
      ...prev,
      [activeModule.id]: nextProgress,
    }));

    if (!user || !db) return;

    try {
      setSaveError("");
      await setDoc(doc(db, "users", user.uid, "progress", activeModule.id), stripUndefined({
        moduleId: activeModule.id,
        subjectId: activeModule.subjectId,
        sectionId: activeModule.sectionId,
        correct: nc,
        attempts: na,
        mastery: moduleMastery,
        weakSkills: nw,
        mistakeCategories,
        recentResults,
        lessonIndex: li,
        activeDays: nextProgress.activeDays,
        averageResponseTimeSeconds,
        totalResponseTimeSeconds,
        updatedAt: serverTimestamp(),
      }), { merge: true });

      if (attempt) {
        await setDoc(doc(db, "mastery", user.uid, "topics", activeModule.id), stripUndefined({
          uid: user.uid,
          subjectId: activeModule.subjectId,
          sectionId: activeModule.sectionId,
          topicId: activeModule.id,
          masteryScore: moduleMastery,
          readinessBand: readinessStatus(moduleMastery, na).label,
          questionsAttempted: na,
          questionsCorrect: nc,
          accuracy: na ? Math.round((nc / na) * 100) : 0,
          averageResponseTimeSeconds,
          confidenceLevel: Math.min(100, Math.round((na / MIN_READY_ATTEMPTS) * 100)),
          mistakeCategories,
          recentResults,
          lastPracticed: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }), { merge: true });
      }

      if (profile?.institutionId) {
        const mergedMap = { ...progressMap, [activeModule.id]: nextProgress };
        let overallCorrect = 0;
        let overallAttempts = 0;
        Object.values(mergedMap).forEach((p) => {
          overallCorrect += p.correct || 0;
          overallAttempts += p.attempts || 0;
        });
        const overallPercent = overallAttempts ? Math.round((overallCorrect / overallAttempts) * 100) : 0;
        void setDoc(doc(db, "profiles", user.uid), stripUndefined({
          overallAccuracy: overallPercent,
          overallAttempts,
          readinessBand: readinessStatus(overallPercent, overallAttempts).label,
          lastActiveAt: serverTimestamp(),
        }), { merge: true }).catch(() => {});
      }
    } catch {
      setSaveError("Your answer was recorded on this device, but progress could not be saved to Firestore.");
    }
  }

  async function recordError(question: Question, result: ReturnType<typeof gradeQuestion>, mistakeCategory: MistakeCategory) {
    const id = `${activeModule.id}_${question.id}`;
    const previous = errorNotebook[id];
    const entry: ErrorNotebookEntry = {
      id,
      questionId: question.id,
      question: question.prompt,
      studentAnswer: result.submitted,
      correctAnswer: result.expected,
      mistakeCategory,
      explanation: question.explanation,
      subjectId: activeModule.subjectId,
      sectionId: activeModule.sectionId,
      moduleTitle: activeModule.title,
      skill: question.skill,
      repeatedMistakes: (previous?.repeatedMistakes || 0) + 1,
      lastMissedAt: Date.now(),
    };

    setErrorNotebook((current) => ({ ...current, [id]: entry }));

    if (!user || !db) return;

    try {
      await setDoc(doc(db, "errorLogs", user.uid, "items", id), stripUndefined({
        ...entry,
        lastMissedAt: serverTimestamp(),
      }), { merge: true });
    } catch {
      setSaveError("Wrong answer was tracked locally, but could not be saved to the error notebook.");
    }
  }

  async function check() {
    if (checked) return;
    if (qType === "multipleChoice" && selected === null) return;
    if (qType === "numeric" && numericAnswer.trim() === "") return;

    setChecked(true);
    const result = gradeQuestion(q, qType === "numeric" ? numericAnswer : selected);
    setGradeResult(result);
    const ok = result.isCorrect;
    const responseTimeSeconds = Math.max(1, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    const mistakeCategory = ok ? undefined : inferMistakeCategory(q.commonMistakes);
    const nc = correct + (ok ? 1 : 0);
    const na = attempts + 1;
    const nw = { ...weak };

    if (!ok) {
      nw[q.skill] = (nw[q.skill] || 0) + 1;
      await recordError(q, result, mistakeCategory || "Concept misunderstanding");
    } else if (nw[q.skill]) {
      nw[q.skill] -= 1;
      if (nw[q.skill] <= 0) delete nw[q.skill];
    }

    setCorrect(nc);
    setAttempts(na);
    setWeak(nw);
    await saveProgress(nc, na, nw, lessonIndex, { isCorrect: ok, responseTimeSeconds, mistakeCategory });
  }

  async function markLessonReviewed(index: number) {
    const li = Math.max(lessonIndex, index + 1);
    setLessonIndex(li);
    await saveProgress(correct, attempts, weak, li);
  }

  function next() {
    setSelected(null);
    setNumericAnswer("");
    setGradeResult(null);
    setShowGuidedHint(false);
    setChecked(false);
    setQi((qi + 1) % practiceQuestions.length);
    questionStartedAtRef.current = Date.now();
  }

  async function gradeRecall(result: "remembered" | "missed") {
    if (!currentRecallItem) return;

    const nextResults = { ...recallResults, [currentRecallItem.id]: result };
    setRecallResults(nextResults);
    setRecallRevealed(false);

    if (Object.keys(nextResults).length < recallItems.length) {
      setRecallIndex((current) => Math.min(current + 1, recallItems.length - 1));
      return;
    }

    setRecallNotice("Recall session complete. Missed items will stay prioritized tomorrow.");
    const nextCompleted = { ...completedPlanItems, recall: true };
    setCompletedPlanItems(nextCompleted);

    if (!user || !db) return;

    try {
      await setDoc(doc(db, "dailySessions", `${user.uid}_${todayKey()}_recall`), stripUndefined({
        uid: user.uid,
        date: todayKey(),
        type: "recall",
        itemIds: recallItems.map((item) => item.id),
        results: nextResults,
        remembered: Object.values(nextResults).filter((value) => value === "remembered").length,
        missed: Object.values(nextResults).filter((value) => value === "missed").length,
        updatedAt: serverTimestamp(),
      }), { merge: true });

      await setDoc(doc(db, "studyPlans", user.uid, "days", todayKey()), stripUndefined({
        completed: nextCompleted,
        updatedAt: serverTimestamp(),
      }), { merge: true });
    } catch {
      setRecallNotice("Recall was completed locally, but could not be saved to Firestore.");
    }
  }

  function restartRecall() {
    setRecallIndex(0);
    setRecallRevealed(false);
    setRecallResults({});
    setRecallNotice("");
  }

  function startMockExam(size: MockExamSize) {
    setMockSize(size);
    setMockStarted(true);
    setMockCurrentIndex(0);
    setMockAnswers({});
    setMockFlags({});
    setMockResults(null);
    setMockStartedAt(Date.now());
  }

  function setMockAnswer(questionId: string, answer: string | number) {
    setMockAnswers((current) => ({ ...current, [questionId]: { questionId, answer } }));
  }

  function toggleMockFlag(questionId: string) {
    setMockFlags((current) => ({ ...current, [questionId]: !current[questionId] }));
  }

  async function finishMockExam() {
    const results: MockExamResult[] = mockQuestions.map(({ question, module }) => {
      const answer = mockAnswers[question.id]?.answer ?? "";
      const result = gradeQuestion(question, answer);
      return {
        questionId: question.id,
        submitted: result.submitted,
        expected: result.expected,
        isCorrect: result.isCorrect,
        skill: question.skill,
        subjectId: module.subjectId,
        sectionId: module.sectionId,
        moduleTitle: module.title,
        difficulty: question.difficulty,
        targetSeconds: question.estimatedSolvingTimeSeconds,
        ...(result.isCorrect ? {} : { mistakeCategory: inferMistakeCategory(question.commonMistakes) }),
      };
    });

    setMockResults(results);
    setMockStarted(false);

    const missed = results.filter((result) => !result.isCorrect);
    const nw = { ...weak };
    missed.forEach((result) => {
      nw[result.skill] = (nw[result.skill] || 0) + 1;
    });
    const correctCount = results.filter((result) => result.isCorrect).length;
    const avgSeconds = results.length ? Math.max(1, Math.round((Date.now() - (mockStartedAt || Date.now())) / 1000 / results.length)) : 1;

    for (const result of missed) {
      const found = mockQuestions.find((item) => item.question.id === result.questionId);
      if (found) await recordError(found.question, { isCorrect: false, submitted: result.submitted, expected: result.expected }, result.mistakeCategory || "Concept misunderstanding");
    }

    await saveProgress(correct + correctCount, attempts + results.length, nw, lessonIndex, {
      isCorrect: correctCount / Math.max(1, results.length) >= 0.7,
      responseTimeSeconds: avgSeconds,
      mistakeCategory: missed[0]?.mistakeCategory,
    });

    if (user && db) {
      try {
        await setDoc(doc(db, "mockExams", user.uid, "exams", `${todayKey()}_${mockSize}`), stripUndefined({
          uid: user.uid,
          date: todayKey(),
          size: mockSize,
          score: results.length ? Math.round((correctCount / results.length) * 100) : 0,
          elapsedSeconds: Math.round((Date.now() - (mockStartedAt || Date.now())) / 1000),
          flagged: mockFlags,
          results,
          updatedAt: serverTimestamp(),
        }), { merge: true });
      } catch {
        setSaveError("Mock exam results were kept locally, but could not be saved to Firestore.");
      }
    }
  }

  async function askTutor() {
    const message = tutorInput.trim();
    if (!message || tutorBusy) return;

    const studentMessage: TutorMessage = { role: "student", content: message };
    setTutorMessages((current) => [...current, studentMessage]);
    setTutorInput("");
    setTutorBusy(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          mode: screen,
          subject: subject.title,
          topic: activeModule.title,
          mastery,
          examDate,
          weakSkills: globalWeakSkills.slice(0, 5).map((item) => item.skill),
          mistakeCategories: Object.entries(activeProgress?.mistakeCategories || {})
            .sort((a, b) => b[1] - a[1])
            .map(([category]) => category),
        }),
      });
      const data = await response.json();
      setTutorMessages((current) => [...current, { role: "tutor", content: data.reply || "I could not generate a tutor response.", source: data.source }]);
    } catch {
      setTutorMessages((current) => [...current, { role: "tutor", content: "I could not reach the tutor endpoint. Try again after the dev server is running." }]);
    } finally {
      setTutorBusy(false);
    }
  }

  async function submitFEAnswer() {
    if (!feQuestion || feComplete) return;
    if (feQuestionType === "multipleChoice" && feSelected === null) return;
    if (feQuestionType === "numeric" && feNumericAnswer.trim() === "") return;

    const result = gradeQuestion(feQuestion, feQuestionType === "numeric" ? feNumericAnswer : feSelected);
    const responseTimeSeconds = Math.max(1, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    const nextResults = [
      ...feResults,
      {
        questionId: feQuestion.id,
        submitted: result.submitted,
        expected: result.expected,
        isCorrect: result.isCorrect,
      },
    ];
    setFeResults(nextResults);
    setFeSelected(null);
    setFeNumericAnswer("");

    if (nextResults.length < feQuestions.length) {
      setFeIndex((current) => current + 1);
      questionStartedAtRef.current = Date.now();
    } else {
      const correctCount = nextResults.filter((row) => row.isCorrect).length;
      const nw = { ...weak };
      if (!result.isCorrect) nw[feQuestion.skill] = (nw[feQuestion.skill] || 0) + 1;
      const category = result.isCorrect ? undefined : inferMistakeCategory(feQuestion.commonMistakes);
      if (!result.isCorrect) await recordError(feQuestion, result, category || "Concept misunderstanding");
      await saveProgress(correct + correctCount, attempts + nextResults.length, nw, lessonIndex, {
        isCorrect: result.isCorrect,
        responseTimeSeconds,
        mistakeCategory: category,
      });
    }
  }

  function restartFEMode() {
    setFeIndex(0);
    setFeSelected(null);
    setFeNumericAnswer("");
    setFeResults([]);
    setShowHandbook(false);
    questionStartedAtRef.current = Date.now();
  }

  function openSubject(id: string) {
    setSubjectId(id);
    setView("subject");
  }

  function openModule(subjId: string, secId: string) {
    setSubjectId(subjId);
    setSectionId(secId);
    setScreen("home");
    setView("module");
    setPracticeFilter(null);
  }

  function practiceWeakSkill(subjId: string, secId: string, skill: string) {
    setSubjectId(subjId);
    setSectionId(secId);
    setScreen("practice");
    setView("module");
    setPracticeFilter(skill);
  }

  function startPlanActivity(activity: DailyPlanActivity) {
    if (activity.kind === "recall") {
      setSubjectId(activity.subjectId);
      setSectionId(activity.sectionId);
      setView("module");
      setScreen("recall");
      return;
    }

    if (activity.kind === "review") {
      setSubjectId(activity.subjectId);
      setSectionId(activity.sectionId);
      setView("module");
      setScreen("errors");
      if (activity.skill) setErrorFilterSkill(activity.skill);
      return;
    }

    setSubjectId(activity.subjectId);
    setSectionId(activity.sectionId);
    setPracticeFilter(activity.skill || null);
    setView("module");
    setScreen(activity.kind === "lesson" ? "learn" : activity.kind === "fe" ? "fe" : "practice");
  }

  async function togglePlanItem(id: string) {
    const next = { ...completedPlanItems, [id]: !completedPlanItems[id] };
    setCompletedPlanItems(next);
    setSavedDailyPlan((current) => current ? { ...current, completed: next } : current);

    if (!user || !db) return;

    try {
      setProfileError("");
      await setDoc(doc(db, "studyPlans", user.uid, "days", todayKey()), stripUndefined({
        date: todayKey(),
        activities: displayPlan,
        completed: next,
        signature: plannerSignature,
        updatedAt: serverTimestamp(),
      }), { merge: true });
    } catch {
      setProfileError("Today's plan completion could not be saved to Firestore.");
    }
  }

  async function markFlashcard(cardIndex: number, confidence: FlashcardConfidence) {
    const cardId = `${activeModule.id}_${cardIndex}`;
    setFlashcardConfidence((current) => ({ ...current, [cardId]: confidence }));

    if (!user || !db) return;

    try {
      await setDoc(doc(db, "flashcards", user.uid, "cards", cardId), stripUndefined({
        moduleId: activeModule.id,
        subjectId: activeModule.subjectId,
        sectionId: activeModule.sectionId,
        cardIndex,
        front: activeModule.flashcards[cardIndex].front,
        confidence,
        updatedAt: serverTimestamp(),
      }));
    } catch {
      setSaveError("Flashcard progress was kept locally, but could not be saved to Firestore.");
    }
  }

  function buildStudyPacketHtml(kind: StudyPacketKind) {
    const packetTitle =
      kind === "formula-sheet" ? `${activeModule.title} Formula Sheet` :
      kind === "today-recall" ? "Today's Recall Packet" :
      "Weak Topic Repair Packet";
    const studentLine = `${profile?.displayName || user?.displayName || "FE student"} | Exam date: ${examDate} | Generated ${todayKey()}`;
    const formulaRows = activeModule.flashcards.map((card) => `
      <tr>
        <td>${escapeHtml(card.front)}</td>
        <td><strong>${escapeHtml(card.back)}</strong><br><span>${escapeHtml(card.note)}</span></td>
      </tr>
    `).join("");
    const recallRows = recallItems.map((item, index) => `
      <article class="block">
        <p class="eyebrow">Recall ${index + 1} | ${escapeHtml(item.source)} | ${escapeHtml(item.dueReason)}</p>
        <h3>${escapeHtml(item.prompt)}</h3>
        <p class="answer">${escapeHtml(item.answer)}</p>
      </article>
    `).join("");
    const weakRows = weakPacketQuestions.map(({ module, question }, index) => `
      <article class="block">
        <p class="eyebrow">Practice ${index + 1} | ${escapeHtml(module.title)} | ${escapeHtml(question.skill)}</p>
        <h3>${escapeHtml(question.prompt)}</h3>
        ${question.choices?.length ? `<ol>${question.choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join("")}</ol>` : `<p class="blank">Numeric answer: ____________________ ${escapeHtml(question.units || "")}</p>`}
        <p><strong>Answer:</strong> ${escapeHtml(questionExpectedAnswer(question))}</p>
        <p><strong>Solution:</strong> ${escapeHtml(question.solution)}</p>
        <p><strong>Repair:</strong> ${escapeHtml(question.repair)}</p>
      </article>
    `).join("");
    const sections = {
      "formula-sheet": `
        <section>
          <h2>Formula Reference</h2>
          <table><tbody>${formulaRows}</tbody></table>
        </section>
        <section>
          <h2>Try These Before Looking Back</h2>
          ${activeModule.questions.slice(0, 4).map((question, index) => `<p>${index + 1}. ${escapeHtml(question.prompt)}</p>`).join("")}
        </section>
      `,
      "today-recall": `
        <section>
          <h2>Morning Recall</h2>
          ${recallRows || "<p>No recall cards are due yet. Review formulas and answer a few practice questions to seed tomorrow's packet.</p>"}
        </section>
      `,
      "weak-review": `
        <section>
          <h2>Weak Topic Repair</h2>
          ${globalWeakSkills.slice(0, 6).map((row) => `<p><strong>${escapeHtml(row.skill)}</strong> - ${row.count} recent miss${row.count === 1 ? "" : "es"} in ${escapeHtml(row.moduleTitle)}</p>`).join("") || "<p>No weak topics are recorded yet, so this packet uses the current module.</p>"}
          ${weakRows}
        </section>
      `,
    };

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(packetTitle)}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;color:#111827;margin:36px;line-height:1.45}
    header{border-bottom:3px solid #0b5cff;margin-bottom:22px;padding-bottom:14px}
    h1{font-size:28px;margin:0 0 6px;color:#0b1736}
    h2{font-size:18px;margin:26px 0 12px;color:#0b1736}
    h3{font-size:15px;margin:5px 0 8px}
    .meta,.eyebrow{color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    td{border:1px solid #d8dee9;padding:11px;vertical-align:top}
    td:first-child{width:34%;font-weight:700}
    .block{break-inside:avoid;border:1px solid #d8dee9;border-radius:8px;padding:14px;margin:12px 0}
    .answer{background:#eef3ff;border-radius:8px;padding:10px}
    .blank{border:1px dashed #98a2b3;border-radius:8px;padding:12px}
    @media print{body{margin:22mm}.block{page-break-inside:avoid}}
  </style>
</head>
<body>
  <header>
    <p class="meta">FE Mission Dreams</p>
    <h1>${escapeHtml(packetTitle)}</h1>
    <p>${escapeHtml(studentLine)}</p>
  </header>
  ${sections[kind]}
</body>
</html>`;
  }

  function downloadStudyPacket(kind: StudyPacketKind) {
    const html = buildStudyPacketHtml(kind);
    downloadHtml(html, `fe-mission-dreams-${kind}-${todayKey()}.html`);
  }

  function buildReadinessReportHtml() {
    const studentName = profile?.displayName || user?.displayName || "FE student";
    const priorityRows = dashboardPriorities.slice(0, 8).map((item) => `
      <tr>
        <td><strong>${escapeHtml(item.subject.title)}</strong><br><span>${escapeHtml(item.currentModule?.title || "No active module")}</span></td>
        <td>${item.percent}%</td>
        <td>${item.attemptsSum}</td>
        <td>${escapeHtml(item.status.label)}</td>
        <td>${item.priority}</td>
      </tr>
    `).join("");
    const weakRows = globalWeakSkills.slice(0, 8).map((row) => `
      <li><strong>${escapeHtml(row.skill)}</strong> - ${row.count} miss${row.count === 1 ? "" : "es"} in ${escapeHtml(row.moduleTitle)}</li>
    `).join("");
    const mistakeRows = adaptiveInsights.mistakeRows.map(([category, count]) => `
      <li><strong>${escapeHtml(category)}</strong> - ${count} recorded miss${count === 1 ? "" : "es"}</li>
    `).join("");
    const planRows = displayPlan.map((activity) => `
      <li><strong>${escapeHtml(activity.title)}</strong> (${activity.minutes} min)<br><span>${escapeHtml(activity.detail)}</span></li>
    `).join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>FE Mission Dreams Readiness Report</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;color:#111827;margin:36px;line-height:1.45;background:#fff}
    header{border-bottom:3px solid #0b5cff;margin-bottom:22px;padding-bottom:14px}
    h1{font-size:30px;margin:0 0 6px;color:#0b1736}
    h2{font-size:18px;margin:28px 0 12px;color:#0b1736}
    .meta{color:#667085;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}
    .score{border:1px solid #d8dee9;border-radius:10px;padding:12px;background:#f8fbff}
    .score b{display:block;font-size:24px;color:#0b1736}
    .score span,li span,td span{color:#667085}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #d8dee9;padding:10px;text-align:left;vertical-align:top}
    th{background:#eef3ff;color:#0b1736;font-size:12px;text-transform:uppercase}
    ul{padding-left:20px}
    li{margin:8px 0}
    .block{break-inside:avoid;border:1px solid #d8dee9;border-radius:10px;padding:14px;margin:12px 0}
    @media print{body{margin:20mm}.score-grid{grid-template-columns:repeat(2,1fr)}.block{page-break-inside:avoid}}
  </style>
</head>
<body>
  <header>
    <p class="meta">FE Mission Dreams readiness report</p>
    <h1>${escapeHtml(studentName)}</h1>
    <p>Exam date: ${escapeHtml(examDate)} | Generated: ${todayKey()} | Discipline: ${escapeHtml(disciplineLabel)}</p>
  </header>
  <section class="score-grid">
    <div class="score"><b>${overallProgress.percent}%</b><span>Exam readiness</span></div>
    <div class="score"><b>${dashboardMetrics.days}</b><span>Days until exam</span></div>
    <div class="score"><b>${overallProgress.attempts}</b><span>Total attempts</span></div>
    <div class="score"><b>${dashboardMetrics.estimatedAverageTime || "-"}</b><span>Avg sec/question</span></div>
  </section>
  <section class="block">
    <h2>Adaptive Summary</h2>
    <p><strong>Repair first:</strong> ${escapeHtml(adaptiveInsights.repair?.skill || adaptiveInsights.evidenceGap?.currentModule?.title || "Build evidence with guided practice")}</p>
    <p><strong>Slowest timed module:</strong> ${escapeHtml(adaptiveInsights.slowest?.module.title || "Not enough timed data yet")}</p>
    <p><strong>Retest target:</strong> ${escapeHtml(adaptiveInsights.retest?.module.title || adaptiveInsights.evidenceGap?.subject.title || "Priority subject")}</p>
  </section>
  <section>
    <h2>Subject Readiness</h2>
    <table>
      <thead><tr><th>Subject</th><th>Accuracy</th><th>Attempts</th><th>Band</th><th>Priority</th></tr></thead>
      <tbody>${priorityRows}</tbody>
    </table>
  </section>
  <section class="block">
    <h2>Weak Skills</h2>
    <ul>${weakRows || "<li>No weak skills recorded yet. Complete guided practice to seed this list.</li>"}</ul>
  </section>
  <section class="block">
    <h2>Mistake Patterns</h2>
    <ul>${mistakeRows || "<li>No mistake categories recorded yet.</li>"}</ul>
  </section>
  <section class="block">
    <h2>Today's Plan</h2>
    <ul>${planRows}</ul>
  </section>
</body>
</html>`;
  }

  function downloadReadinessReport() {
    downloadHtml(buildReadinessReportHtml(), `fe-mission-dreams-readiness-report-${todayKey()}.html`);
  }

  function buildMockExamReportHtml() {
    const results = mockResults || [];
    const correctCount = results.filter((result) => result.isCorrect).length;
    const missedCount = results.length - correctCount;
    const subjectRows = mockReviewSummary.subjectRows.map((row) => `
      <tr>
        <td>${escapeHtml(row.subjectTitle)}</td>
        <td>${row.correct}/${row.total}</td>
        <td>${row.percent}%</td>
      </tr>
    `).join("");
    const weakRows = mockWeakSkills.map(([skill, count]) => `<li><strong>${escapeHtml(skill)}</strong> - ${count} miss${count === 1 ? "" : "es"}</li>`).join("");
    const mistakeRows = mockMistakeCategories.map(([category, count]) => `<li><strong>${escapeHtml(category)}</strong> - ${count}</li>`).join("");
    const reviewRows = mockQuestions.map(({ question }, index) => {
      const result = results.find((row) => row.questionId === question.id);
      return `
        <article class="block ${result?.isCorrect ? "good" : "bad"}">
          <p class="eyebrow">Question ${index + 1} | ${escapeHtml(result?.moduleTitle || "Module")} | ${escapeHtml(question.skill)}</p>
          <h3>${escapeHtml(question.prompt)}</h3>
          <p><strong>Submitted:</strong> ${escapeHtml(result?.submitted || "No answer")}<br><strong>Correct:</strong> ${escapeHtml(result?.expected || "No answer")}</p>
          ${result?.isCorrect ? "" : `<p><strong>Repair:</strong> ${escapeHtml(question.repair)}</p><p><strong>Mistake category:</strong> ${escapeHtml(result?.mistakeCategory || inferMistakeCategory(question.commonMistakes))}</p>`}
          <p><strong>Solution:</strong> ${escapeHtml(question.solution)}</p>
        </article>
      `;
    }).join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>FE Mission Dreams Mock Exam Report</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;color:#111827;margin:36px;line-height:1.45}
    header{border-bottom:3px solid #0b5cff;margin-bottom:22px;padding-bottom:14px}
    h1{font-size:30px;margin:0 0 6px;color:#0b1736}
    h2{font-size:18px;margin:26px 0 12px;color:#0b1736}
    h3{font-size:15px;margin:5px 0 8px}
    .meta,.eyebrow{color:#667085;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}
    .score{border:1px solid #d8dee9;border-radius:10px;padding:12px;background:#f8fbff}
    .score b{display:block;font-size:24px;color:#0b1736}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #d8dee9;padding:10px;text-align:left}
    th{background:#eef3ff;color:#0b1736;font-size:12px;text-transform:uppercase}
    ul{padding-left:20px}
    li{margin:8px 0}
    .block{break-inside:avoid;border:1px solid #d8dee9;border-radius:10px;padding:14px;margin:12px 0}
    .good{border-left:5px solid #16a06a}
    .bad{border-left:5px solid #e8594f}
    @media print{body{margin:20mm}.score-grid{grid-template-columns:repeat(2,1fr)}.block{page-break-inside:avoid}}
  </style>
</head>
<body>
  <header>
    <p class="meta">FE Mission Dreams mock exam report</p>
    <h1>${mockSize}-Question Mock Exam</h1>
    <p>Generated ${todayKey()} | Exam date: ${escapeHtml(examDate)} | ${escapeHtml(disciplineLabel)}</p>
  </header>
  <section class="score-grid">
    <div class="score"><b>${mockScore}%</b><span>Score</span></div>
    <div class="score"><b>${correctCount}</b><span>Correct</span></div>
    <div class="score"><b>${missedCount}</b><span>Missed</span></div>
    <div class="score"><b>${Math.round(mockElapsedSeconds / Math.max(1, results.length)) || "-"}</b><span>Sec/question</span></div>
  </section>
  <section>
    <h2>Subject Breakdown</h2>
    <table><thead><tr><th>Subject</th><th>Correct</th><th>Score</th></tr></thead><tbody>${subjectRows}</tbody></table>
  </section>
  <section>
    <h2>Weak Topics</h2>
    <ul>${weakRows || "<li>No weak topics from this set.</li>"}</ul>
  </section>
  <section>
    <h2>Mistake Categories</h2>
    <ul>${mistakeRows || "<li>No missed-question categories.</li>"}</ul>
  </section>
  <section>
    <h2>Question Review</h2>
    ${reviewRows}
  </section>
</body>
</html>`;
  }

  function downloadMockExamReport() {
    if (!mockResults) return;
    downloadHtml(buildMockExamReportHtml(), `fe-mission-dreams-mock-${mockSize}-report-${todayKey()}.html`);
  }

  function downloadHtml(html: string, filename: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function updateCalculatorScore(id: string, score: number) {
    const nextScore = Math.min(100, Math.max(0, score || 0));
    setCalculatorScores((current) => {
      const next = { ...current, [id]: nextScore };
      void saveProfilePatch({ diagnosticScores: next });
      return next;
    });
  }

  async function saveProfilePatch(patch: Partial<ProfileDraft>) {
    if (!profile) return;

    const nextProfile: StudentProfile = {
      ...profile,
      ...patch,
      uid: profile.uid,
    };

    setProfile(nextProfile);

    if (!user || !db) return;

    try {
      setProfileError("");
      await setDoc(doc(db, "profiles", user.uid), stripUndefined({
        ...nextProfile,
        updatedAt: serverTimestamp(),
      }), { merge: true });
    } catch {
      setProfileError("Profile changes were kept locally, but could not be saved to Firestore.");
    }
  }

  async function completeOnboarding(draft: ProfileDraft) {
    const nextProfile: StudentProfile = {
      uid: user?.uid || "preview",
      ...(user?.displayName ? { displayName: user.displayName } : {}),
      ...(user?.email ? { email: user.email } : {}),
      discipline: draft.discipline,
      examDate: draft.examDate,
      availableStudyHoursPerWeek: draft.availableStudyHoursPerWeek,
      diagnosticScores: draft.diagnosticScores,
    };

    setProfile(nextProfile);
    setExamDate(nextProfile.examDate || getDefaultExamDate());
    setCalculatorScores(nextProfile.diagnosticScores);
    const firstSubject = DISCIPLINE_SUBJECTS[draft.discipline][0];
    setSubjectId(firstSubject.id);
    setSectionId(firstSubject.sections[0]?.id || "");

    if (!user || !db) return;

    try {
      setProfileError("");
      await setDoc(doc(db, "profiles", user.uid), stripUndefined({
        ...nextProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }), { merge: true });
      await setDoc(doc(db, "users", user.uid), stripUndefined({
        uid: user.uid,
        displayName: user.displayName || null,
        email: user.email || null,
        role: "student",
        updatedAt: serverTimestamp(),
      }), { merge: true });
    } catch {
      setProfileError("Your profile could not be saved. Please check Firestore access and try again.");
      setProfile(null);
    }
  }

  function updateExamDate(nextDate: string) {
    const safeDate = nextDate || getDefaultExamDate();
    setExamDate(safeDate);
    void saveProfilePatch({ examDate: safeDate });
  }

  function updateDiscipline(nextDiscipline: FEDiscipline) {
    const nextSubjects = DISCIPLINE_SUBJECTS[nextDiscipline];
    const nextScores = Object.fromEntries(nextSubjects.map((subject) => [
      subject.id,
      profile?.diagnosticScores?.[subject.id] ?? DEFAULT_TARGET_SCORE,
    ]));
    const firstSubject = nextSubjects[0];

    setCalculatorScores(nextScores);
    setSubjectId(firstSubject.id);
    setSectionId(firstSubject.sections[0]?.id || "");
    setView("dashboard");
    void saveProfilePatch({ discipline: nextDiscipline, diagnosticScores: nextScores });
  }

  async function joinInstitution() {
    const code = institutionCode.trim().toUpperCase();
    if (!code || !user || !db) return;

    setInstitutionBusy(true);
    setInstitutionNotice("");

    try {
      const codeSnap = await getDoc(doc(db, "inviteCodes", code));
      if (!codeSnap.exists()) {
        setInstitutionNotice("That invite code was not found. Check it with your instructor and try again.");
        return;
      }

      const institutionId = codeSnap.data().institutionId as string;
      const institutionSnap = await getDoc(doc(db, "institutions", institutionId));
      if (!institutionSnap.exists()) {
        setInstitutionNotice("That class could not be found anymore.");
        return;
      }

      await setDoc(doc(db, "profiles", user.uid), stripUndefined({
        institutionId,
        overallAccuracy: overallProgress.percent,
        overallAttempts: overallProgress.attempts,
        readinessBand: overallProgress.status.label,
        lastActiveAt: serverTimestamp(),
      }), { merge: true });

      setProfile((current) => current ? { ...current, institutionId } : current);
      setInstitution({ id: institutionSnap.id, ...institutionSnap.data() } as Institution);
      setInstitutionCode("");
      setInstitutionNotice(`Joined ${institutionSnap.data().name}.`);
    } catch {
      setInstitutionNotice("Could not join that class. Please try again.");
    } finally {
      setInstitutionBusy(false);
    }
  }

  async function leaveInstitution() {
    if (!user || !db) return;

    setInstitutionBusy(true);
    setInstitutionNotice("");

    try {
      await setDoc(doc(db, "profiles", user.uid), { institutionId: deleteField() }, { merge: true });
      setProfile((current) => current ? { ...current, institutionId: undefined } : current);
      setInstitution(null);
    } catch {
      setInstitutionNotice("Could not leave the class right now. Please try again.");
    } finally {
      setInstitutionBusy(false);
    }
  }

  async function callAuthedRoute(path: string, body?: unknown) {
    if (!user) throw new Error("Sign in before using this action.");
    const token = await user.getIdToken();
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : "{}",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  const launchConfigChecks = [
    {
      label: "App URL",
      ready: Boolean(healthConfig?.appUrl),
      detail: "NEXT_PUBLIC_APP_URL",
      next: "Set this to the production domain before deployment.",
    },
    {
      label: "Firebase client",
      ready: Boolean(healthConfig?.firebaseClient),
      detail: "NEXT_PUBLIC_FIREBASE_*",
      next: "Add the Firebase web app values so login works in the browser.",
    },
    {
      label: "Firebase Admin",
      ready: Boolean(healthConfig?.firebaseAdmin),
      detail: "FIREBASE_CLIENT_EMAIL / PRIVATE_KEY",
      next: "Add service account fields so server routes can verify users and roles.",
    },
    {
      label: "Stripe billing",
      ready: Boolean(healthConfig?.stripe),
      detail: "STRIPE_SECRET_KEY / PRICE / WEBHOOK",
      next: "Create the Pro price, add the secret key, and set the webhook signing secret.",
    },
    {
      label: "AI Tutor",
      ready: Boolean(healthConfig?.aiTutor),
      detail: "OPENAI_API_KEY",
      next: "Missing key uses the built-in tutor fallback. Add a server-only key before enabling live AI in production.",
    },
    {
      label: "Auth bypass disabled",
      ready: healthConfig ? !healthConfig.previewMode : false,
      detail: "NEXT_PUBLIC_PREVIEW_SKIP_AUTH=false",
      next: "Keep preview auth bypass off for production. Turn it on only for local demos.",
    },
  ];
  const launchReadyCount = launchConfigChecks.filter((check) => check.ready).length;

  async function startBilling(action: BillingAction) {
    if (previewMode) {
      setBillingNotice("Preview mode cannot open Stripe. Add Firebase and Stripe keys, then sign in to test billing.");
      return;
    }

    try {
      setBillingBusy(action);
      setBillingNotice("");
      const data = await callAuthedRoute(action === "checkout" ? "/api/stripe/checkout" : "/api/stripe/portal");
      if (data.url) window.location.href = data.url;
    } catch (error) {
      setBillingNotice(error instanceof Error ? error.message : "Billing is not available right now.");
    } finally {
      setBillingBusy(null);
    }
  }

  async function submitAdminQuestion() {
    try {
      setAdminNotice("");
      const trimmedChoices = adminDraft.choices.map((choice) => choice.trim()).filter(Boolean);
      const payload = {
        ...adminDraft,
        choices: adminDraft.questionType === "multipleChoice" ? trimmedChoices : [],
        numericAnswer: adminDraft.questionType === "numeric" ? Number(adminDraft.numericAnswer) : undefined,
        acceptableTolerance: adminDraft.questionType === "numeric" && adminDraft.acceptableTolerance.trim() ? Number(adminDraft.acceptableTolerance) : undefined,
        handbookKeywords: adminDraft.handbookKeywords.split(",").map((item) => item.trim()).filter(Boolean),
        commonMistakes: adminDraft.commonMistakes.split(",").map((item) => item.trim()).filter(Boolean),
      };
      const data = await callAuthedRoute("/api/admin/questions", {
        ...payload,
      });
      setAdminDraft(DEFAULT_ADMIN_DRAFT);
      setAdminNotice(`Draft sent to review: ${data.id}`);
    } catch (error) {
      setAdminNotice(error instanceof Error ? error.message : "Admin draft could not be saved.");
    }
  }

  if (loading) return <main className="auth"><b>Loading FE Mission Dreams...</b></main>;
  if (!user && !previewMode) return <Auth onPreview={() => setPreviewMode(true)} />;
  if (profileLoading) return <main className="auth"><b>Loading your FE profile...</b></main>;
  if (!profile) return <Onboarding user={user} error={profileError} onComplete={completeOnboarding} />;

  if (view === "dashboard") {
    return (
      <main className="shell shell-wide">
        <header className="topbar">
          <div className="brand">FE MISSION DREAMS</div>
          <h1 className="title">Today&apos;s Study Plan</h1>
          <div className="sub">Your {disciplineLabel} journey, focused on today&apos;s highest-leverage work.</div>
        </header>
        <section className="content">
          <section className="card dashboard-hero">
            <div>
              <span className={`status-pill ${overallProgress.status.tone}`}>{overallProgress.status.label}</span>
              <h2>Exam readiness: {overallProgress.percent}%</h2>
              <p className="sub">{disciplineLabel} / {profile.availableStudyHoursPerWeek} study hours/week / The plan will prioritize weak high-weight subjects first.</p>
            </div>
            <div className="hero-controls">
              <label className="exam-date-field" htmlFor="dashboard-discipline">
                <span>FE discipline</span>
                <select id="dashboard-discipline" value={activeDiscipline} onChange={(e) => updateDiscipline(e.target.value as FEDiscipline)}>
                  {Object.entries(DISCIPLINE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="exam-date-field" htmlFor="exam-date">
                <span>Exam date</span>
                <input id="exam-date" type="date" value={examDate} onChange={(e) => updateExamDate(e.target.value)} />
              </label>
            </div>
          </section>
          {profileError && <div className="feedback bad"><b>Profile sync notice</b><p>{profileError}</p></div>}

          <section className="metric-grid">
            <div className="metric-card"><b>{dashboardMetrics.days}</b><span>Days until exam</span></div>
            <div className="metric-card"><b>{dashboardMetrics.studyStreak}</b><span>Day study streak</span></div>
            <div className="metric-card"><b>{dashboardMetrics.questionsCompleted}</b><span>Questions completed</span></div>
            <div className="metric-card"><b>{dashboardMetrics.accuracy}%</b><span>Accuracy</span></div>
            <div className="metric-card"><b>{dashboardMetrics.estimatedAverageTime || "-"}</b><span>Avg seconds/question</span></div>
            <div className="metric-card"><b>{dashboardMetrics.weakestSubject}</b><span>Weakest subject</span></div>
            <div className="metric-card"><b>{dashboardMetrics.strongest}</b><span>Strongest subject</span></div>
            <button type="button" className="metric-card metric-card-button" onClick={() => setView("coverage")}><b>{coverageStats.percent}%</b><span>Content coverage</span></button>
          </section>

          <section className="card activity-card">
            <div className="split-title">
              <div>
                <span className="pill"><CalendarDays size={13} /> STUDY ACTIVITY</span>
                <h2>{studyActivity.activeThisWeek} of {studyActivity.weeklyGoal} active days this week</h2>
              </div>
              <strong>{studyActivity.weeklyPercent}%</strong>
            </div>
            <div className="progress"><div style={{ width: `${studyActivity.weeklyPercent}%` }} /></div>
            <div className="activity-strip" aria-label="Last 14 study days">
              {studyActivity.days.map((day) => (
                <div key={day.key} className={`activity-day ${day.active ? "active" : ""} ${day.isToday ? "today" : ""}`} title={`${day.key}${day.active ? " studied" : " no activity"}`}>
                  <span>{day.label}</span>
                  <b>{new Date(`${day.key}T00:00:00`).getDate()}</b>
                </div>
              ))}
            </div>
            <p className="note">Complete at least one practice, FE Mode, or mock exam question to mark a study day active.</p>
          </section>

          <div className="dashboard-top">
            <section className="card continue-card">
              <span className="pill"><PlayCircle size={13} /> CONTINUE LEARNING</span>
              <h3><Rocket size={19} /> {continueModule.id} {continueModule.title}</h3>
              <p className="sub">Section: {continueLessonTitle}</p>
              <button className="primary" onClick={() => openModule(continueModule.subjectId, continueModule.sectionId)}>Continue</button>
            </section>

            <section className="card today-plan-card">
              <div className="split-title">
                <div>
                  <span className="pill"><CalendarDays size={13} /> TODAY&apos;S PLAN</span>
                  <h2>{todayPlanProgress.done} of {todayPlanProgress.total} activities complete</h2>
                </div>
                <strong>{todayPlanProgress.percent}%</strong>
              </div>
              <div className="progress"><div style={{ width: `${todayPlanProgress.percent}%` }} /></div>
              {plannerNotice && <p className="note planner-notice">{plannerNotice}</p>}
              <div className="today-plan-list">
                {displayPlan.map((activity) => {
                  const done = Boolean(completedPlanItems[activity.id]);
                  return (
                    <div key={activity.id} className={`today-plan-row ${done ? "done" : ""}`}>
                      <button type="button" className="plan-check" aria-label={done ? "Mark incomplete" : "Mark complete"} onClick={() => void togglePlanItem(activity.id)}>
                        {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <button type="button" className="plan-main" onClick={() => startPlanActivity(activity)}>
                        <strong>{activity.title}</strong>
                        <span>{activity.detail}</span>
                        {activity.rationale && <span className="plan-rationale">{activity.rationale}</span>}
                      </button>
                      <span className="plan-time"><Timer size={14} /> {activity.minutes}m</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="card priority-card">
              <span className="pill"><ClipboardList size={13} /> TOP PRIORITY</span>
              <h3>{dashboardPriorities[0]?.subject.title || "Build your baseline"}</h3>
              <p className="sub">
                Diagnostic {dashboardPriorities[0]?.diagnostic ?? DEFAULT_TARGET_SCORE}% / Weight {dashboardPriorities[0]?.weight ?? 0} / Priority {dashboardPriorities[0]?.priority ?? 0}
              </p>
              {dashboardPriorities[0]?.currentModule && (
                <button className="secondary" onClick={() => openModule(dashboardPriorities[0].subject.id, dashboardPriorities[0].currentModule!.sectionId)}>
                  <Target size={16} /> Start priority topic
                </button>
              )}
            </section>
          </div>

          <section className="dashboard-quick-actions">
            <button className="quick-action" onClick={() => openModule(continueModule.subjectId, continueModule.sectionId)}>
              <CalendarDays size={18} /><span>Recall</span><b>{recallItems.length} due</b>
            </button>
            <button className="quick-action" onClick={() => {
              openModule(continueModule.subjectId, continueModule.sectionId);
              setScreen("mock");
            }}>
              <Flag size={18} /><span>Mock Exam</span><b>10 / 20 / 50</b>
            </button>
            <button className="quick-action" onClick={() => {
              openModule(continueModule.subjectId, continueModule.sectionId);
              setScreen("tutor");
            }}>
              <Globe size={18} /><span>AI Tutor</span><b>Ask now</b>
            </button>
            <button className="quick-action" onClick={() => {
              openModule(continueModule.subjectId, continueModule.sectionId);
              setScreen("packets");
            }}>
              <FileText size={18} /><span>Packets</span><b>Print-ready</b>
            </button>
          </section>

          <section className="card adaptive-cockpit">
            <div className="split-title">
              <div>
                <span className="pill"><Gauge size={13} /> ADAPTIVE ENGINE</span>
                <h2>{adaptiveInsights.dataState === "baseline" ? "Build the evidence baseline" : "Your next best study moves"}</h2>
              </div>
              <strong>{overallProgress.attempts}</strong>
            </div>
            <div className="adaptive-cockpit-grid">
              <article>
                <span>Repair first</span>
                <b>{adaptiveInsights.repair?.skill || adaptiveInsights.evidenceGap?.currentModule?.title || "Start diagnostic practice"}</b>
                <p>{adaptiveInsights.repair ? `${adaptiveInsights.repair.count} misses in ${adaptiveInsights.repair.moduleTitle}` : "Answer a few guided questions so weak skills become visible."}</p>
                {adaptiveInsights.repair ? (
                  <button className="chip" onClick={() => practiceWeakSkill(adaptiveInsights.repair!.subjectId, adaptiveInsights.repair!.sectionId, adaptiveInsights.repair!.skill)}>
                    <Wrench size={14} /> Repair
                  </button>
                ) : adaptiveInsights.evidenceGap?.currentModule ? (
                  <button className="chip" onClick={() => openModule(adaptiveInsights.evidenceGap!.subject.id, adaptiveInsights.evidenceGap!.currentModule!.sectionId)}>
                    <Target size={14} /> Build evidence
                  </button>
                ) : null}
              </article>
              <article>
                <span>Mistake pattern</span>
                <b>{adaptiveInsights.mistakeRows[0]?.[0] || "No pattern yet"}</b>
                <p>{adaptiveInsights.mistakeRows.length ? adaptiveInsights.mistakeRows.map(([category, count]) => `${category}: ${count}`).join(" / ") : "Missed answers will be grouped by formula, units, arithmetic, concept, and timing."}</p>
                <button className="chip" onClick={() => {
                  openModule(continueModule.subjectId, continueModule.sectionId);
                  setScreen("errors");
                }}><FileText size={14} /> Notebook</button>
              </article>
              <article>
                <span>Timing watch</span>
                <b>{adaptiveInsights.slowest ? `${adaptiveInsights.slowest.avgTime}s avg` : `${dashboardMetrics.estimatedAverageTime || "-"} avg`}</b>
                <p>{adaptiveInsights.slowest ? `${adaptiveInsights.slowest.module.title} is your slowest practiced module.` : "Timing will appear once you complete practice or FE Mode questions."}</p>
                <button className="chip" onClick={() => {
                  openModule(adaptiveInsights.slowest?.module.subjectId || continueModule.subjectId, adaptiveInsights.slowest?.module.sectionId || continueModule.sectionId);
                  setScreen("fe");
                }}><Timer size={14} /> Timed set</button>
              </article>
              <article>
                <span>Retest target</span>
                <b>{adaptiveInsights.retest?.module.title || adaptiveInsights.evidenceGap?.subject.title || "Priority subject"}</b>
                <p>{adaptiveInsights.retest ? `${adaptiveInsights.retest.mastery}% mastery after ${adaptiveInsights.retest.attempts} attempts.` : "Subjects under 5 attempts need more evidence before readiness is trusted."}</p>
                <button className="chip" onClick={() => {
                  const target = adaptiveInsights.retest?.module || adaptiveInsights.evidenceGap?.currentModule || continueModule;
                  openModule(target.subjectId, target.sectionId);
                  setScreen("practice");
                }}><TrendingUp size={14} /> Retest</button>
              </article>
            </div>
            <div className="adaptive-report-actions">
              <button className="secondary" onClick={downloadReadinessReport}><FileText size={16} /> Download readiness report</button>
            </div>
          </section>

          <section className="card dashboard-tutor-card">
            <div className="split-title">
              <div>
                <span className="pill"><Globe size={13} /> AI TUTOR</span>
                <h2>Ask your FE coach</h2>
              </div>
              <strong>{mastery}%</strong>
            </div>
            <div className="dashboard-tutor-preview">
              <p>{tutorMessages[tutorMessages.length - 1]?.content || "Ask me what to repair first, how to use the FE Reference Handbook, or why a mistake keeps happening."}</p>
            </div>
            <div className="dashboard-tutor-actions">
              <button className="secondary" onClick={() => {
                openModule(continueModule.subjectId, continueModule.sectionId);
                setScreen("tutor");
              }}><Globe size={17} /> Open Tutor</button>
              <button className="primary" onClick={() => {
                openModule(continueModule.subjectId, continueModule.sectionId);
                setTutorInput("What should I study next based on my weak topics?");
                setScreen("tutor");
              }}><Target size={17} /> Ask next move</button>
            </div>
          </section>

          <section className="dashboard-section">
            <div>
              <span className="pill"><Wrench size={13} /> PRIORITY REPAIR ZONE</span>
              <h2>Weak skills, across every subject</h2>
            </div>
            {globalWeakSkills.length === 0 ? (
              <div className="card repair-empty">
                <p className="sub">No weak skills yet. Once you practice a few questions, anything you miss shows up here so you can fix it fast, no matter which subject it is in.</p>
              </div>
            ) : (
              <div className="repair-list">
                {globalWeakSkills.map((row) => (
                  <div key={`${row.moduleId}:${row.skill}`} className="repair-row">
                    <div className="repair-row-info">
                      <span className="repair-count">{row.count}x</span>
                      <div>
                        <strong>{row.skill}</strong>
                        <span className="note">{row.moduleTitle}</span>
                      </div>
                    </div>
                    <button type="button" className="chip repair-cta" onClick={() => practiceWeakSkill(row.subjectId, row.sectionId, row.skill)}>
                      <Wrench size={14} /> Practice
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section account-section">
            <div>
              <span className="pill"><UserPlus size={13} /> ACCOUNT</span>
              <h2>Account and class</h2>
            </div>
            <div className="account-grid">
          {(isAdmin || previewMode) && (
            <section className="card launch-config-card">
              <div className="split-title">
                <div>
                  <span className="pill"><Gauge size={13} /> LAUNCH CONFIG</span>
                  <h2>Deployment readiness</h2>
                </div>
                <strong>{healthConfig ? launchReadyCount : "-"}/6</strong>
              </div>
              <p className="sub">Safe status check for production services. No secret values are exposed.</p>
              <div className="config-check-list">
                {launchConfigChecks.map(({ label, ready, detail, next }) => (
                  <div key={label} className={`config-check ${ready ? "ready" : "missing"}`}>
                    {ready ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <div>
                      <strong>{label}</strong>
                      <span>{detail}</span>
                      {!ready && <small>{next}</small>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="launch-next-steps">
                <h3>Next launch steps</h3>
                <ol>
                  <li>Add Stripe billing keys when you are ready to charge for Pro.</li>
                  <li>Add `OPENAI_API_KEY` when you want live AI Tutor responses instead of the built-in fallback.</li>
                  <li>Keep `NEXT_PUBLIC_PREVIEW_SKIP_AUTH=false` for production deployments.</li>
                </ol>
              </div>
            </section>
          )}
          <section className="card billing-card">
            <div className="split-title">
              <div>
                <span className="pill"><Lock size={13} /> FREE / PRO</span>
                <h2>{subscription?.tier === "pro" ? "Pro study access" : "Free study access"}</h2>
              </div>
              <strong>{subscription?.status || "free"}</strong>
            </div>
            <p className="sub">Free includes the core learning flow. Pro is ready for expanded question banks, full mocks, AI tutor limits, PDFs, and launch subscriptions.</p>
            {billingNotice && <p className="note billing-notice">{billingNotice}</p>}
            <div className="billing-actions">
              {subscription?.tier === "pro" ? (
                <button className="primary" disabled={billingBusy !== null} onClick={() => void startBilling("portal")}>
                  <FileText size={17} /> {billingBusy === "portal" ? "Opening..." : "Manage billing"}
                </button>
              ) : (
                <button className="primary" disabled={billingBusy !== null} onClick={() => void startBilling("checkout")}>
                  <Rocket size={17} /> {billingBusy === "checkout" ? "Opening..." : "Upgrade to Pro"}
                </button>
              )}
              <button className="secondary" disabled={billingBusy !== null || !subscription?.stripeCustomerId} onClick={() => void startBilling("portal")}>
                <Globe size={17} /> Billing portal
              </button>
            </div>
          </section>

          <section className="card class-card">
            <span className="pill"><Users size={13} /> YOUR CLASS</span>
            {institution ? (
              <>
                <h2>{institution.name}</h2>
                <p className="sub">Your instructor can see your overall accuracy and readiness band on their class dashboard.</p>
                {institutionNotice && <p className="note">{institutionNotice}</p>}
                <button className="secondary" disabled={institutionBusy} onClick={() => void leaveInstitution()}>
                  {institutionBusy ? "Leaving..." : "Leave class"}
                </button>
              </>
            ) : (
              <>
                <h2>Join your class</h2>
                <p className="sub">Enter the invite code your instructor shared to link your progress to their class dashboard.</p>
                {institutionNotice && <p className="note">{institutionNotice}</p>}
                <div className="billing-actions">
                  <input
                    value={institutionCode}
                    onChange={(e) => setInstitutionCode(e.target.value)}
                    placeholder="Invite code"
                    disabled={institutionBusy}
                  />
                  <button className="primary" disabled={institutionBusy || !institutionCode.trim()} onClick={() => void joinInstitution()}>
                    <UserPlus size={17} /> {institutionBusy ? "Joining..." : "Join"}
                  </button>
                </div>
              </>
            )}
          </section>

          {isAdmin && (
            <section className="card admin-card">
              <span className="pill"><ClipboardList size={13} /> ADMIN QUESTION REVIEW</span>
              <h2>Submit a draft question</h2>
              <p className="sub">Admin drafts are saved to Firestore review records before they become published student content.</p>
              <div className="admin-editor-grid">
                <label>
                  <span>Subject</span>
                  <select value={adminDraft.subjectId} onChange={(e) => {
                    const nextSubject = activeSubjects.find((item) => item.id === e.target.value) || activeSubjects[0];
                    setAdminDraft((current) => ({ ...current, subjectId: nextSubject.id, sectionId: nextSubject.sections[0]?.id || current.sectionId }));
                  }}>
                    {activeSubjects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
                <label>
                  <span>Section</span>
                  <select value={adminDraft.sectionId} onChange={(e) => setAdminDraft((current) => ({ ...current, sectionId: e.target.value }))}>
                    {adminSections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
                <label>
                  <span>Difficulty</span>
                  <select value={adminDraft.difficulty} onChange={(e) => setAdminDraft((current) => ({ ...current, difficulty: e.target.value as Question["difficulty"] }))}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
                <label>
                  <span>Question type</span>
                  <select value={adminDraft.questionType} onChange={(e) => setAdminDraft((current) => ({ ...current, questionType: e.target.value as AdminQuestionDraft["questionType"] }))}>
                    <option value="multipleChoice">Multiple choice</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </label>
              </div>
              <label>
                <span>Skill</span>
                <input value={adminDraft.skill} onChange={(e) => setAdminDraft((current) => ({ ...current, skill: e.target.value }))} placeholder="Example: Law of Cosines setup" />
              </label>
              <label>
                <span>Prompt</span>
                <textarea value={adminDraft.prompt} onChange={(e) => setAdminDraft((current) => ({ ...current, prompt: e.target.value }))} placeholder="Question prompt" />
              </label>
              {adminDraft.questionType === "multipleChoice" ? (
                <div className="admin-choice-grid">
                  {adminDraft.choices.map((choice, index) => (
                    <label key={index}>
                      <span>Choice {String.fromCharCode(65 + index)}</span>
                      <input
                        value={choice}
                        onChange={(e) => setAdminDraft((current) => {
                          const choices = [...current.choices];
                          choices[index] = e.target.value;
                          return { ...current, choices };
                        })}
                        placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                      />
                    </label>
                  ))}
                  <label>
                    <span>Correct answer</span>
                    <input value={adminDraft.answer} onChange={(e) => setAdminDraft((current) => ({ ...current, answer: e.target.value }))} placeholder="Exact correct choice text or A/B/C/D" />
                  </label>
                </div>
              ) : (
                <div className="admin-editor-grid">
                  <label>
                    <span>Numeric answer</span>
                    <input type="number" step="any" value={adminDraft.numericAnswer} onChange={(e) => setAdminDraft((current) => ({ ...current, numericAnswer: e.target.value }))} placeholder="42.5" />
                  </label>
                  <label>
                    <span>Tolerance</span>
                    <input type="number" step="any" value={adminDraft.acceptableTolerance} onChange={(e) => setAdminDraft((current) => ({ ...current, acceptableTolerance: e.target.value }))} placeholder="0.1" />
                  </label>
                  <label>
                    <span>Units</span>
                    <input value={adminDraft.units} onChange={(e) => setAdminDraft((current) => ({ ...current, units: e.target.value }))} placeholder="kPa, N, mm" />
                  </label>
                </div>
              )}
              <div className="admin-editor-grid">
                <label>
                  <span>Formula used</span>
                  <input value={adminDraft.formulaUsed} onChange={(e) => setAdminDraft((current) => ({ ...current, formulaUsed: e.target.value }))} placeholder="sigma = P / A" />
                </label>
                <label>
                  <span>Handbook keywords</span>
                  <input value={adminDraft.handbookKeywords} onChange={(e) => setAdminDraft((current) => ({ ...current, handbookKeywords: e.target.value }))} placeholder="stress, axial load, area" />
                </label>
                <label>
                  <span>Mistake categories</span>
                  <input value={adminDraft.commonMistakes} onChange={(e) => setAdminDraft((current) => ({ ...current, commonMistakes: e.target.value }))} placeholder="Wrong formula, Unit conversion" />
                </label>
              </div>
              <label>
                <span>Solution</span>
                <textarea value={adminDraft.solution} onChange={(e) => setAdminDraft((current) => ({ ...current, solution: e.target.value }))} placeholder="Worked solution and review notes" />
              </label>
              <label>
                <span>Common trap</span>
                <textarea value={adminDraft.trap} onChange={(e) => setAdminDraft((current) => ({ ...current, trap: e.target.value }))} placeholder="What wrong path will students likely take?" />
              </label>
              <label>
                <span>Repair note</span>
                <textarea value={adminDraft.repair} onChange={(e) => setAdminDraft((current) => ({ ...current, repair: e.target.value }))} placeholder="How should the student fix the mistake next time?" />
              </label>
              {adminNotice && <p className="note">{adminNotice}</p>}
              <button className="primary" disabled={!adminDraftReady} onClick={() => void submitAdminQuestion()}>
                <CheckCircle2 size={17} /> Submit for review
              </button>
            </section>
          )}
            </div>
          </section>

          <div className="dashboard-top dashboard-secondary deprecated-dashboard-block">
            <section className="card">
              <div className="split-title">
                <div>
                  <span className="pill"><Gauge size={13} /> OVERALL PROGRESS</span>
                  <h3>Your readiness so far</h3>
                </div>
                <strong>{overallProgress.percent}%</strong>
              </div>
              <div className="progress"><div style={{ width: `${overallProgress.percent}%` }} /></div>
              <p className="note">Based on {overallProgress.attempts} practice attempts across all subjects.</p>
            </section>

            <section className="card continue-card">
              <span className="pill"><PlayCircle size={13} /> CONTINUE LEARNING</span>
              <h3><Rocket size={19} /> {continueModule.id} {continueModule.title}</h3>
              <p className="sub">Section: {continueLessonTitle}</p>
              <button className="primary" onClick={() => openModule(continueModule.subjectId, continueModule.sectionId)}>Continue</button>
            </section>

            <section className="card priority-card">
              <span className="pill"><ClipboardList size={13} /> TOP PRIORITY</span>
              <h3>{dashboardPriorities[0]?.subject.title || "Build your baseline"}</h3>
              <p className="sub">
                Diagnostic {dashboardPriorities[0]?.diagnostic ?? DEFAULT_TARGET_SCORE}% / Weight {dashboardPriorities[0]?.weight ?? 0} / Priority {dashboardPriorities[0]?.priority ?? 0}
              </p>
              {dashboardPriorities[0]?.currentModule && (
                <button className="secondary" onClick={() => openModule(dashboardPriorities[0].subject.id, dashboardPriorities[0].currentModule!.sectionId)}>
                  <Target size={16} /> Start priority topic
                </button>
              )}
            </section>
          </div>

          <section className="card today-plan-card deprecated-dashboard-block">
            <div className="split-title">
              <div>
                <span className="pill"><CalendarDays size={13} /> TODAY&apos;S PLAN</span>
                <h2>{todayPlanProgress.done} of {todayPlanProgress.total} activities complete</h2>
              </div>
              <strong>{todayPlanProgress.percent}%</strong>
            </div>
            <div className="progress"><div style={{ width: `${todayPlanProgress.percent}%` }} /></div>
            {plannerNotice && <p className="note planner-notice">{plannerNotice}</p>}
            <div className="today-plan-list">
              {displayPlan.map((activity) => {
                const done = Boolean(completedPlanItems[activity.id]);
                return (
                  <div key={activity.id} className={`today-plan-row ${done ? "done" : ""}`}>
                    <button type="button" className="plan-check" aria-label={done ? "Mark incomplete" : "Mark complete"} onClick={() => void togglePlanItem(activity.id)}>
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <button type="button" className="plan-main" onClick={() => startPlanActivity(activity)}>
                      <strong>{activity.title}</strong>
                      <span>{activity.detail}</span>
                      {activity.rationale && <span className="plan-rationale">{activity.rationale}</span>}
                    </button>
                    <span className="plan-time"><Timer size={14} /> {activity.minutes}m</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dashboard-section deprecated-dashboard-block">
            <div>
              <span className="pill"><Wrench size={13} /> PRIORITY REPAIR ZONE</span>
              <h2>Weak skills, across every subject</h2>
            </div>
            {globalWeakSkills.length === 0 ? (
              <div className="card repair-empty">
                <p className="sub">No weak skills yet. Once you practice a few questions, anything you miss shows up here so you can fix it fast, no matter which subject it is in.</p>
              </div>
            ) : (
              <div className="repair-list">
                {globalWeakSkills.map((row) => (
                  <div key={`${row.moduleId}:${row.skill}`} className="repair-row">
                    <div className="repair-row-info">
                      <span className="repair-count">{row.count}x</span>
                      <div>
                        <strong>{row.skill}</strong>
                        <span className="note">{row.moduleTitle}</span>
                      </div>
                    </div>
                    <button type="button" className="chip repair-cta" onClick={() => practiceWeakSkill(row.subjectId, row.sectionId, row.skill)}>
                      <Wrench size={14} /> Practice
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div>
              <span className="pill"><Compass size={13} /> FE MECHANICAL ROADMAP</span>
              <h2>Your guided study plan</h2>
            </div>
            <div className="roadmap-list">
              {subjectStats.map((stat) => (
                <div key={stat.subject.id} className="roadmap-row">
                  <button type="button" className="roadmap-row-header" onClick={() => openSubject(stat.subject.id)}>
                    <div className="roadmap-row-top">
                      <strong>{String(stat.subject.order).padStart(2, "0")}. {stat.subject.title}</strong>
                      <span className={`status-pill ${stat.status.tone}`}>{stat.status.label}</span>
                    </div>
                    <div className="progress"><div style={{ width: `${stat.percent}%` }} /></div>
                    <div className="roadmap-meta">
                      <span>{stat.percent}% accuracy from {stat.attemptsSum} attempts</span>
                      {stat.currentSection && <span>Current: {stat.currentSection.title}</span>}
                    </div>
                  </button>
                  {stat.currentModule && (
                    <button
                      type="button"
                      className="chip roadmap-cta"
                      onClick={() => openModule(stat.subject.id, stat.currentModule!.sectionId)}
                    >
                      <PlayCircle size={15} /> {stat.completedCount > 0 ? "Continue" : "Start"} {stat.currentModule.title}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="split-title">
              <div>
                <span className="pill"><Layers size={13} /> CONTENT PROGRESS</span>
                <h3>Curriculum buildout</h3>
              </div>
              <strong>{sectionCompletion}%</strong>
            </div>
            <div className="progress"><div style={{ width: `${sectionCompletion}%` }} /></div>
            <p className="note">{liveModules} of {activeTotalPlannedSections} planned sections have production modules connected.</p>
          </section>

          <section className="card question-bank-card">
            <div className="split-title">
              <div>
                <span className="pill"><ClipboardList size={13} /> QUESTION BANK TARGET</span>
                <h3>{disciplineLabel}</h3>
              </div>
              <strong>{questionBankStats.active.questions}/{MIN_QUESTION_BANK_TARGET}</strong>
            </div>
            <div className="progress"><div style={{ width: `${questionBankStats.active.minimumPercent}%` }} /></div>
            <p className="note">
              Minimum launch target is {MIN_QUESTION_BANK_TARGET} verified questions. Stretch target is {STRETCH_QUESTION_BANK_TARGET}.
              {questionBankStats.active.minimumRemaining > 0
                ? ` Add ${questionBankStats.active.minimumRemaining} more for minimum full-exam readiness.`
                : " Minimum target reached for this discipline."}
            </p>
            <button type="button" className="secondary" onClick={() => setView("coverage")}>
              <Layers size={16} /> View all discipline banks
            </button>
          </section>

          <FEExamCalculator
            subjects={activeSubjects}
            disciplineLabel={disciplineLabel}
            scores={calculatorScores}
            targetScore={targetScore}
            onScoreChange={updateCalculatorScore}
            onTargetChange={setTargetScore}
            onSelectSubject={openSubject}
          />

          <button className="secondary" onClick={() => auth && signOut(auth)}><LogOut size={16} /> Sign out</button>
        </section>
      </main>
    );
  }

  if (view === "coverage") {
    return (
      <main className="shell shell-wide">
        <header className="topbar">
          <button className="linkbutton" onClick={() => setView("dashboard")}><ChevronLeft size={15} /> Back to dashboard</button>
          <div className="brand">FE MISSION DREAMS</div>
          <h1 className="title">Content Coverage Map</h1>
          <div className="sub">Track subject, topic, lesson, formula, and question buildout for the {disciplineLabel} app.</div>
        </header>
        <section className="content">
          <section className="metric-grid">
            <div className="metric-card"><b>{coverageStats.percent}%</b><span>Ready sections</span></div>
            <div className="metric-card"><b>{coverageStats.liveSections}/{coverageStats.totalSections}</b><span>Sections connected</span></div>
            <div className="metric-card"><b>{coverageStats.totalLessons}</b><span>Lessons</span></div>
            <div className="metric-card"><b>{coverageStats.totalFormulas}</b><span>Formula cards</span></div>
            <div className="metric-card"><b>{coverageStats.totalQuestions}</b><span>Questions</span></div>
            <div className="metric-card"><b>{coverageStats.readySections}</b><span>Ready sections</span></div>
            <div className="metric-card"><b>{coverageStats.totalSections - coverageStats.liveSections}</b><span>Not started</span></div>
            <div className="metric-card"><b>{activeTotalPlannedSections}</b><span>Planned sections</span></div>
          </section>

          <section className="card bank-production-card">
            <div className="split-title">
              <div>
                <span className="pill"><ClipboardList size={13} /> 150-250 QUESTION BANK PLAN</span>
                <h2>Verified question bank by discipline</h2>
              </div>
              <strong>{questionBankStats.totalQuestions}</strong>
            </div>
            <p className="sub">Minimum target is {MIN_QUESTION_BANK_TARGET} reviewed questions per discipline before a full 110-question exam simulator should be enabled. Stretch target is {STRETCH_QUESTION_BANK_TARGET} per discipline.</p>
            <div className="bank-grid">
              {questionBankStats.disciplines.map((item) => (
                <article key={item.discipline} className={`bank-row ${item.discipline === activeDiscipline ? "active" : ""}`}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.modules} modules / {item.connectedSections} of {item.totalSections} sections connected</span>
                  </div>
                  <div className="bank-progress">
                    <b>{item.questions}</b>
                    <div className="progress"><div style={{ width: `${item.minimumPercent}%` }} /></div>
                    <small>
                      {item.minimumRemaining > 0
                        ? `${item.minimumRemaining} to minimum / ${item.stretchRemaining} to stretch`
                        : `${item.stretchRemaining} to stretch`}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="coverage-map">
            {coverageStats.rows.map((row) => (
              <article key={row.subject.id} className="card coverage-subject">
                <div className="split-title">
                  <div>
                    <span className="pill">{String(row.subject.order).padStart(2, "0")}</span>
                    <h2>{row.subject.title}</h2>
                    <p className="sub">{row.live}/{row.sections.length} sections connected / {row.questions} questions</p>
                  </div>
                  <strong>{row.percent}%</strong>
                </div>
                <div className="progress"><div style={{ width: `${row.percent}%` }} /></div>
                <div className="coverage-section-list">
                  {row.sections.map((section) => (
                    <button
                      key={section.sectionId}
                      type="button"
                      className={`coverage-section ${section.status.toLowerCase().replace(" ", "-")}`}
                      onClick={() => section.hasModule ? openModule(section.subjectId, section.sectionId) : openSubject(section.subjectId)}
                    >
                      <span>
                        <b>{section.title}</b>
                        <small>{section.lessons} lessons / {section.formulas} formulas / {section.questions} questions</small>
                      </span>
                      <strong>{section.status}</strong>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </section>
      </main>
    );
  }

  if (view === "subject") {
    const stat = subjectStats.find((s) => s.subject.id === subject.id);

    return (
      <main className="shell">
        <header className="topbar">
          <button className="linkbutton" onClick={() => setView("dashboard")}><ChevronLeft size={15} /> Back to dashboard</button>
          <div className="brand">FE MISSION DREAMS</div>
          <h1 className="title">{subject.title}</h1>
          <div className="sub">{disciplineLabel} | {subject.sections.length} syllabus sections</div>
        </header>
        <section className="content">
          <div className="card">
            <span className="pill"><Compass size={13} /> SUBJECT MAP</span>
            <h2>{subject.title}</h2>
            <p className="sub">Open a section to study concepts, references, flashcards, FE-style problems, full solutions, repair, retest, and mastery.</p>
          </div>
          <div className="section-list">
            {subject.sections.map((sec) => {
              const mod = activeModuleRegistry[`${subject.id}:${sec.id}`];
              const live = !!mod;
              const isCurrent = live && stat?.currentModule?.id === mod.id;
              const p = live ? progressMap[mod.id] : undefined;
              const li = live ? Math.min(p?.lessonIndex || 0, mod.lessons.length) : 0;

              return (
                <div key={sec.id} className={`section-card ${isCurrent ? "current" : ""}`}>
                  <button type="button" className="action" onClick={live ? () => openModule(subject.id, sec.id) : undefined} disabled={!live}>
                    <strong>{sec.title}</strong>
                    <span>{live ? `${mod.id} ${mod.title} | Open production module` : "Production content pipeline | section framework ready"}</span>
                  </button>
                  {isCurrent && mod && (
                    <div className="lesson-tree">
                      {mod.lessons.map((lesson, i) => {
                        const status = i < li ? "done" : i === li ? "current" : "upcoming";
                        const LessonIcon = status === "done" ? CheckCircle2 : status === "current" ? PlayCircle : Circle;
                        return (
                          <button
                            type="button"
                            key={lesson.title}
                            className={`lesson-row ${status}`}
                            onClick={() => {
                              openModule(subject.id, sec.id);
                              setScreen("learn");
                            }}
                          >
                            <span className="lesson-icon"><LessonIcon size={16} /></span>
                            <span>{i + 1}. {lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="card">
            <h3>Every section will contain</h3>
            <p>Learn | Formula / Reference Review | Flashcards | FE-style Problems | Full Worked Solutions | Diagnose Mistake | Repair Problem | Retest | Mastery</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <button className="linkbutton" onClick={() => {
          setSubjectId(activeModule.subjectId);
          setView("subject");
        }}><ChevronLeft size={15} /> Back to {subject.title}</button>
        <div className="brand">FE MISSION DREAMS</div>
        <h1 className="title">{activeModule.id} | {activeModule.title}</h1>
        <div className="sub">Learn | Reference | Flashcards | Problems | Solution | Repair | Mastery</div>
      </header>
      <div className="tabs">
        {(["home", "learn", "reference", "flash", "recall", "packets", "practice", "fe", "mock", "tutor", "errors", "mastery"] as ModuleScreen[]).map((x) => {
          const TabIcon = x === "home" ? LayoutDashboard : x === "learn" ? BookOpen : x === "reference" ? Calculator : x === "flash" ? Layers : x === "recall" ? CalendarDays : x === "packets" ? ClipboardList : x === "practice" ? Target : x === "fe" ? Lock : x === "mock" ? Flag : x === "tutor" ? Globe : x === "errors" ? FileText : TrendingUp;
          return (
            <button key={x} className={`tab ${screen === x ? "active" : ""}`} onClick={() => { setScreen(x); if (x === "practice") setPracticeFilter(null); }}>
              <TabIcon size={14} /> {x === "reference" ? "Reference" : x === "flash" ? "Flashcards" : x === "packets" ? "Packets" : x === "practice" ? "Guided" : x === "fe" ? "FE Mode" : x === "mock" ? "Mock" : x === "tutor" ? "Tutor" : x === "errors" ? "Errors" : x[0].toUpperCase() + x.slice(1)}
            </button>
          );
        })}
      </div>
      <section className="content">
        {saveError && <div className="feedback bad"><b>Progress sync notice</b><p>{saveError}</p></div>}
        {screen === "home" && (
          <>
            <div className="card hero">
              <span className="pill">{activeModule.id}</span>
              <h2>{activeModule.title}</h2>
              <p className="sub">Concept review, formula recall, FE-style practice, complete worked solutions, and targeted repair.</p>
              <div className="statrow">
                <div className="stat"><b>{mastery}%</b>Mastery</div>
                <div className="stat"><b>{attempts}</b>Attempts</div>
                <div className="stat"><b>{correct}</b>Correct</div>
              </div>
            </div>
            <div className="grid">
              <button className="action" onClick={() => setScreen("learn")}><span className="action-icon"><BookOpen size={19} /></span><strong>Learn</strong><span>Core concepts and decision rules</span></button>
              <button className="action" onClick={() => setScreen("reference")}><span className="action-icon"><Calculator size={19} /></span><strong>FE Reference Hub</strong><span>Formulas, keywords, traps, and related practice</span></button>
              <button className="action" onClick={() => setScreen("flash")}><span className="action-icon"><Layers size={19} /></span><strong>Flashcards</strong><span>Fast formula recall</span></button>
              <button className="action" onClick={() => setScreen("recall")}><span className="action-icon"><CalendarDays size={19} /></span><strong>Daily Recall</strong><span>Spaced review from misses and formulas</span></button>
              <button className="action" onClick={() => setScreen("packets")}><span className="action-icon"><ClipboardList size={19} /></span><strong>PDF Packets</strong><span>Print-ready formula, recall, and weak-topic sheets</span></button>
              <button className="action" onClick={() => { setScreen("practice"); setPracticeFilter(null); }}><span className="action-icon"><Target size={19} /></span><strong>Guided Practice</strong><span>Hints, grading, and full worked solutions</span></button>
              <button className="action" onClick={() => setScreen("fe")}><span className="action-icon"><Lock size={19} /></span><strong>FE Mode</strong><span>No hints or formulas until the set is complete</span></button>
              <button className="action" onClick={() => setScreen("mock")}><span className="action-icon"><Flag size={19} /></span><strong>Mock Exams</strong><span>Timed 10, 20, and 50-question sets</span></button>
              <button className="action" onClick={() => setScreen("tutor")}><span className="action-icon"><Globe size={19} /></span><strong>AI Tutor</strong><span>Mode-aware coaching with your progress context</span></button>
              <button className="action" onClick={() => setScreen("errors")}><span className="action-icon"><FileText size={19} /></span><strong>Error Notebook</strong><span>Review repeated mistakes by skill and category</span></button>
              <button className="action" onClick={() => setScreen("mastery")}><span className="action-icon"><TrendingUp size={19} /></span><strong>Diagnose / Mastery</strong><span>Weak skills, repair, and progress</span></button>
            </div>
          </>
        )}
        {screen === "learn" && (
          <>
            {activeModule.lessons.map((l, i) => {
              const status = i < lessonIndex ? "done" : i === lessonIndex ? "current" : "upcoming";
              return (
                <article className={`card lesson lesson-status-${status}`} key={l.title}>
                  <span className="pill">{status === "done" ? <CheckCircle2 size={13} /> : <PlayCircle size={13} />} LESSON {i + 1}{status === "done" ? " · Reviewed" : ""}</span>
                  <h3>{l.title}</h3>
                  <p>{l.body}</p>
                  {status !== "done" && (
                    <button type="button" className="secondary lesson-mark" onClick={() => markLessonReviewed(i)}><CheckCircle2 size={14} /> Mark reviewed</button>
                  )}
                </article>
              );
            })}
            <div className="card">
              <span className="pill"><Calculator size={13} /> FORMULA / REFERENCE REVIEW</span>
              {activeModule.flashcards.map((f) => (
                <p key={f.front}><b>{f.front}:</b> <Formula text={f.back} /> <span className="note">- {f.note}</span></p>
              ))}
            </div>
            <button className="primary" onClick={() => setScreen("flash")}>Continue to flashcards</button>
          </>
        )}
        {screen === "reference" && (
          <>
            <section className="card reference-hero">
              <div className="split-title">
                <div>
                  <span className="pill"><Calculator size={13} /> FE REFERENCE HUB</span>
                  <h2>{activeModule.title}</h2>
                </div>
                <strong>{filteredReferenceItems.length}</strong>
              </div>
              <p className="sub">Use this as a study index for formulas, units, handbook keywords, and related practice. Open the official NCEES handbook separately for the licensed source document.</p>
              <div className="reference-toolbar">
                <input value={referenceQuery} onChange={(e) => setReferenceQuery(e.target.value)} placeholder="Search formulas, units, keywords, or topics" />
                <a className="secondary reference-link" href="https://ncees.org/exams/fe-exam/" target="_blank" rel="noreferrer">
                  <Globe size={16} /> Official source
                </a>
              </div>
              <div className="reference-categories">
                {referenceCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={referenceCategory === category ? "active" : ""}
                    onClick={() => setReferenceCategory(category)}
                  >
                    {category === "all" ? "All" : category === "pinned" ? `Pinned (${Object.values(pinnedReferences).filter(Boolean).length})` : category}
                  </button>
                ))}
              </div>
            </section>

            {filteredReferenceItems.length === 0 ? (
              <section className="card repair-empty">
                <h3>No formula matched</h3>
                <p className="sub">Try a broader keyword like units, stress, efficiency, vector, or angle.</p>
              </section>
            ) : (
              <section className="reference-grid">
                {filteredReferenceItems.map((item) => (
                  <article key={item.id} className="card reference-card">
                    <div className="split-title">
                      <div>
                        <span className="pill">{item.moduleTitle}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <button
                        type="button"
                        className={`pin-button ${pinnedReferences[item.id] ? "active" : ""}`}
                        aria-label={pinnedReferences[item.id] ? "Unpin formula" : "Pin formula"}
                        onClick={() => setPinnedReferences((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                    <div className="formula-box">
                      <Formula text={item.formula} />
                    </div>
                    <div className="reference-detail-grid">
                      <div><span>When to use</span><b>{item.whenToUse}</b></div>
                      <div><span>Common mistake</span><b>{item.commonMistake}</b></div>
                      <div><span>Units</span><b>{item.units || "Match the problem statement"}</b></div>
                      <div><span>Practice links</span><b>{item.relatedQuestionCount} related</b></div>
                    </div>
                    <p className="sub">{item.note}</p>
                    {item.keywords.length > 0 && (
                      <div className="reference-keywords">
                        {item.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
                      </div>
                    )}
                    <div className="reference-actions">
                      <button className="secondary" onClick={() => {
                        setPracticeFilter(null);
                        setScreen("practice");
                      }}><Target size={15} /> Practice</button>
                      <button className="secondary" onClick={() => setScreen("flash")}><Layers size={15} /> Recall</button>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
        {screen === "flash" && (
          <>
            <div className="card flash" onClick={() => setFlipped(!flipped)}>
              <span className="pill">CARD {fi + 1} / {activeModule.flashcards.length}</span>
              {!flipped ? (
                <>
                  <h2>{activeModule.flashcards[fi].front}</h2>
                  <p className="note">Tap card to reveal</p>
                </>
              ) : (
                <>
                  <h2><Formula text={activeModule.flashcards[fi].back} /></h2>
                  <p>{activeModule.flashcards[fi].note}</p>
                </>
              )}
            </div>
            {flipped && (
              <div className="flash-actions">
                <button className={`secondary ${activeFlashcardConfidence === "again" ? "selected" : ""}`} onClick={() => void markFlashcard(fi, "again")}><XCircle size={17} /> Again</button>
                <button className={`primary ${activeFlashcardConfidence === "got-it" ? "selected" : ""}`} onClick={() => void markFlashcard(fi, "got-it")}><CheckCircle2 size={17} /> Got it</button>
              </div>
            )}
            {activeFlashcardConfidence && <p className="note flash-note">Marked: {activeFlashcardConfidence === "got-it" ? "Got it" : "Again"}</p>}
            <button className="primary" onClick={() => {
              setFi((fi + 1) % activeModule.flashcards.length);
              setFlipped(false);
            }}>Next card</button>
          </>
        )}
        {screen === "recall" && (
          <>
            <section className="card recall-card">
              <div className="split-title">
                <div>
                  <span className="pill"><CalendarDays size={13} /> DAILY RECALL</span>
                  <h2>{recallComplete ? "Recall complete" : `Card ${Math.min(recallIndex + 1, recallItems.length)} of ${recallItems.length}`}</h2>
                </div>
                <strong>{recallItems.length ? `${recallRemembered}/${recallItems.length}` : "0/0"}</strong>
              </div>
              <p className="sub">Recall is based on missed skills, formulas, and topics with low evidence. Try to answer from memory before revealing.</p>
              {recallNotice && <p className="note">{recallNotice}</p>}
            </section>

            {recallItems.length === 0 ? (
              <section className="card">
                <h3>No recall due yet</h3>
                <p className="sub">Practice a few questions or review flashcards, and tomorrow&apos;s recall queue will start filling itself.</p>
              </section>
            ) : recallComplete ? (
              <section className="card">
                <span className="pill"><CheckCircle2 size={13} /> SUMMARY</span>
                <h2>{recallRemembered} remembered, {recallItems.length - recallRemembered} missed</h2>
                <div className="recall-summary">
                  {recallItems.map((item) => (
                    <div key={item.id} className={`recall-summary-row ${recallResults[item.id] || "missed"}`}>
                      <span>{item.prompt}</span>
                      <b>{recallResults[item.id] === "remembered" ? "Remembered" : "Review again"}</b>
                    </div>
                  ))}
                </div>
                <button className="primary" onClick={restartRecall}>Restart recall</button>
              </section>
            ) : (
              <section className="card recall-prompt">
                <div className="question-tags">
                  <span>{currentRecallItem.dueReason === "missed" ? "Previous miss" : currentRecallItem.dueReason === "formula" ? "Formula" : "Stale topic"}</span>
                  <span>{currentRecallItem.source}</span>
                </div>
                <h2>{currentRecallItem.prompt}</h2>
                {!recallRevealed ? (
                  <button className="primary" onClick={() => setRecallRevealed(true)}>Reveal answer</button>
                ) : (
                  <>
                    <div className="feedback good">
                      <b>Answer</b>
                      <p>{currentRecallItem.answer}</p>
                    </div>
                    <div className="recall-actions">
                      <button className="secondary" onClick={() => void gradeRecall("missed")}><XCircle size={17} /> Missed</button>
                      <button className="primary" onClick={() => void gradeRecall("remembered")}><CheckCircle2 size={17} /> Remembered</button>
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}
        {screen === "packets" && (
          <>
            <section className="card packet-hero">
              <div className="split-title">
                <div>
                  <span className="pill"><ClipboardList size={13} /> PDFS / FLASHCARDS</span>
                  <h2>Build a study packet</h2>
                </div>
                <strong>{todayKey()}</strong>
              </div>
              <p className="sub">Download print-ready HTML packets, open them in the browser, then print or save as PDF. Packets use the current module, today's recall queue, and tracked weak skills.</p>
            </section>
            <section className="packet-grid">
              <button type="button" className="card packet-card" onClick={() => downloadStudyPacket("formula-sheet")}>
                <span className="pill"><Calculator size={13} /> FORMULAS</span>
                <h3>Formula sheet</h3>
                <p className="sub">{activeModule.flashcards.length} formulas and reference notes from {activeModule.title}.</p>
              </button>
              <button type="button" className="card packet-card" onClick={() => downloadStudyPacket("today-recall")}>
                <span className="pill"><CalendarDays size={13} /> RECALL</span>
                <h3>Today's recall packet</h3>
                <p className="sub">{recallItems.length} memory prompts from missed skills, formulas, and low-evidence topics.</p>
              </button>
              <button type="button" className="card packet-card" onClick={() => downloadStudyPacket("weak-review")}>
                <span className="pill"><Wrench size={13} /> REPAIR</span>
                <h3>Weak-topic packet</h3>
                <p className="sub">{weakPacketQuestions.length} targeted practice items with answers, worked solutions, and repair notes.</p>
              </button>
            </section>
            <section className="card packet-preview">
              <span className="pill"><FileText size={13} /> PACKET PREVIEW</span>
              <h3>What will be included</h3>
              <div className="packet-preview-grid">
                <div>
                  <b>Formula cards</b>
                  {activeModule.flashcards.slice(0, 4).map((card) => <p key={card.front} className="note">{card.front}: <Formula text={card.back} /></p>)}
                </div>
                <div>
                  <b>Recall queue</b>
                  {recallItems.slice(0, 4).map((item) => <p key={item.id} className="note">{item.prompt}</p>)}
                  {!recallItems.length && <p className="note">No recall cards due yet.</p>}
                </div>
                <div>
                  <b>Weak repairs</b>
                  {weakPacketQuestions.slice(0, 4).map(({ question }) => <p key={question.id} className="note">{question.skill}</p>)}
                </div>
              </div>
            </section>
          </>
        )}
        {screen === "practice" && (
          <>
            {practiceFilter && (
              <div className="feedback bad filter-banner">
                <span><Wrench size={15} /> Repair mode: <b>{practiceFilter}</b> ({practiceQuestions.length} question{practiceQuestions.length === 1 ? "" : "s"})</span>
                <button type="button" className="linkbutton" onClick={() => setPracticeFilter(null)}><X size={14} /> Show all questions</button>
              </div>
            )}
            {practiceQuestions.length === 0 ? (
              <div className="card"><p>No questions matched this filter.</p><button className="secondary" onClick={() => setPracticeFilter(null)}>Show all questions</button></div>
            ) : (
          <div className="card">
            <div className="question-meta">
              <span className="pill">{q.difficulty.toUpperCase()}</span>
              <span className="note">{qi + 1}/{practiceQuestions.length} | {q.skill}</span>
            </div>
            <div className="question-tags">
              <span>{qType === "numeric" ? "Numeric entry" : "Multiple choice"}</span>
              {q.estimatedSolvingTimeSeconds && <span>{q.estimatedSolvingTimeSeconds}s target</span>}
              {q.units && <span>Units: {q.units}</span>}
            </div>
            <h2>{q.prompt}</h2>
            {!checked && (
              <div className="guided-help">
                <button type="button" className="chip" onClick={() => setShowGuidedHint((current) => !current)}>
                  <BookOpen size={14} /> {showGuidedHint ? "Hide hint" : "Show guided hint"}
                </button>
                {showGuidedHint && <p className="note">{q.repair}</p>}
              </div>
            )}
            {qType === "multipleChoice" ? (
              (q.choices || []).map((c, i) => {
                let cl = "choice";
                if (selected === i) cl += " selected";
                if (checked && i === q.answer) cl += " correct";
                if (checked && selected === i && i !== q.answer) cl += " wrong";
                return (
                  <button disabled={checked} className={cl} key={c} onClick={() => setSelected(i)}>
                    <b>{String.fromCharCode(65 + i)}.</b> {c}
                    {checked && i === q.answer && <CheckCircle2 size={17} className="choice-icon" />}
                    {checked && selected === i && i !== q.answer && <XCircle size={17} className="choice-icon" />}
                  </button>
                );
              })
            ) : (
              <label className="numeric-answer" htmlFor="numeric-answer">
                <span>Final answer {q.units ? `(${q.units})` : ""}</span>
                <input
                  id="numeric-answer"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={numericAnswer}
                  disabled={checked}
                  onChange={(e) => setNumericAnswer(e.target.value)}
                  placeholder="Enter numeric answer"
                />
              </label>
            )}
            {!checked ? (
              <button className="primary" disabled={qType === "numeric" ? numericAnswer.trim() === "" : selected === null} onClick={check}>Check answer</button>
            ) : (
              <>
                <div className={`feedback ${gradeResult?.isCorrect ? "good" : "bad"}`}>
                  <b>{gradeResult?.isCorrect ? <><CheckCircle2 size={16} /> Correct - skill strengthened</> : <><XCircle size={16} /> Diagnose: {q.skill}</>}</b>
                  {gradeResult && <p>Submitted: {gradeResult.submitted} | Correct: {gradeResult.expected}</p>}
                  <p>{q.explanation}</p>
                </div>
                <div className="feedback good">
                  <b>Full worked solution</b>
                  {q.formulaUsed && <p><b>Formula:</b> <Formula text={q.formulaUsed} /></p>}
                  {q.solution.split("\n").map((line, i) => <p key={i} style={{ margin: "8px 0" }}>{line}</p>)}
                  {q.handbookKeywords?.length ? <p className="note">Handbook keywords: {q.handbookKeywords.join(", ")}</p> : null}
                </div>
                {!gradeResult?.isCorrect && (
                  <div className="feedback bad">
                    <b>Repair this skill</b>
                    <p>{q.repair}</p>
                    <span className="note">Common trap: {q.trap}</span>
                    {q.commonMistakes?.length ? <span className="note">Likely mistake categories: {q.commonMistakes.join(", ")}</span> : null}
                  </div>
                )}
                <button className="primary" onClick={next}>Next / Retest question</button>
              </>
            )}
          </div>
            )}
          </>
        )}
        {screen === "fe" && (
          <>
            <section className="card fe-mode-card">
              <div className="split-title">
                <div>
                  <span className="pill"><Lock size={13} /> FE MODE</span>
                  <h2>{feComplete ? "Set complete" : `Question ${Math.min(feIndex + 1, feQuestions.length)} of ${feQuestions.length}`}</h2>
                </div>
                <strong>{feComplete ? `${feScore}%` : `${feResults.length}/${feQuestions.length}`}</strong>
              </div>
              <p className="sub">No hints, topic labels, formulas, or worked solutions are shown during the set. Open the handbook only when you deliberately choose to use it.</p>
              <button type="button" className="secondary handbook-toggle" onClick={() => setShowHandbook((current) => !current)}>
                <BookOpen size={16} /> {showHandbook ? "Close handbook" : "Open FE Reference Handbook"}
              </button>
              {showHandbook && (
                <div className="handbook-panel">
                  {activeModule.flashcards.map((f) => (
                    <p key={f.front}><b>{f.front}:</b> <Formula text={f.back} /> <span className="note">- {f.note}</span></p>
                  ))}
                </div>
              )}
            </section>

            {!feComplete ? (
              <section className="card">
                <div className="question-meta">
                  <span className="pill">{feQuestion.difficulty.toUpperCase()}</span>
                  <span className="note">{feQuestionType === "numeric" ? "Numeric entry" : "Multiple choice"}</span>
                </div>
                <h2>{feQuestion.prompt}</h2>
                {feQuestionType === "multipleChoice" ? (
                  (feQuestion.choices || []).map((choice, i) => (
                    <button
                      key={choice}
                      type="button"
                      className={`choice ${feSelected === i ? "selected" : ""}`}
                      onClick={() => setFeSelected(i)}
                    >
                      <b>{String.fromCharCode(65 + i)}.</b> {choice}
                    </button>
                  ))
                ) : (
                  <label className="numeric-answer" htmlFor="fe-numeric-answer">
                    <span>Final answer</span>
                    <input
                      id="fe-numeric-answer"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={feNumericAnswer}
                      onChange={(e) => setFeNumericAnswer(e.target.value)}
                      placeholder="Enter numeric answer"
                    />
                  </label>
                )}
                <button className="primary" disabled={feQuestionType === "numeric" ? feNumericAnswer.trim() === "" : feSelected === null} onClick={submitFEAnswer}>
                  Submit final answer
                </button>
              </section>
            ) : (
              <section className="card fe-results">
                <span className="pill"><CheckCircle2 size={13} /> REVIEW</span>
                <h2>FE Mode score: {feScore}%</h2>
                <div className="progress"><div style={{ width: `${feScore}%` }} /></div>
                {feQuestions.map((question, i) => {
                  const result = feResults.find((row) => row.questionId === question.id);
                  return (
                    <div key={question.id} className={`fe-review-row ${result?.isCorrect ? "good" : "bad"}`}>
                      <div>
                        <strong>{i + 1}. {question.skill}</strong>
                        <p>{question.prompt}</p>
                        <span className="note">Submitted: {result?.submitted || "No answer"} | Correct: {result?.expected || "No answer"}</span>
                      </div>
                      <div className="feedback good">
                        <b>Solution</b>
                        {question.formulaUsed && <p><b>Formula:</b> <Formula text={question.formulaUsed} /></p>}
                        {question.solution.split("\n").map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
                      </div>
                    </div>
                  );
                })}
                <button className="primary" onClick={restartFEMode}>Start another FE Mode set</button>
              </section>
            )}
          </>
        )}
        {screen === "mock" && (
          <>
            <section className="card">
              <div className="split-title">
                <div>
                  <span className="pill"><Flag size={13} /> MOCK EXAMS</span>
                  <h2>{mockResults ? "Exam results" : mockStarted ? `Question ${mockCurrentIndex + 1} of ${mockQuestions.length}` : "Choose a timed set"}</h2>
                </div>
                <strong>{mockStarted ? `${Math.floor(mockElapsedSeconds / 60)}:${String(mockElapsedSeconds % 60).padStart(2, "0")}` : mockResults ? `${mockScore}%` : ""}</strong>
              </div>
              <p className="sub">Strict grading, no explanations during the exam, flag-for-review, navigator, and results after completion.</p>
            </section>

            {!mockStarted && !mockResults && (
              <section className="mock-launch-grid">
                {([10, 20, 50] as MockExamSize[]).map((size) => (
                  <button key={size} type="button" className="card mock-launch" onClick={() => startMockExam(size)} disabled={mockQuestionPool.length < size}>
                    <span className="pill">{size} QUESTIONS</span>
                    <h3>{size === 10 ? "Topic quiz" : size === 20 ? "Subject exam" : "Mixed exam"}</h3>
                    <p className="sub">{Math.round((size * 180) / 60)} min target | {mockQuestionPool.length < size ? "Need more questions" : "Ready"}</p>
                  </button>
                ))}
                <div className="card mock-launch disabled">
                  <span className="pill">FULL SIMULATION</span>
                  <h3>Full-length FE-style simulation</h3>
                  <p className="sub">Locked until the bank has enough reviewed questions.</p>
                </div>
              </section>
            )}

            {mockStarted && mockCurrent && (
              <section className="card mock-exam-card">
                <div className="mock-status">
                  <span>{mockQuestions.length} questions</span>
                  <span>{Object.keys(mockAnswers).length} answered</span>
                  <span>{Object.values(mockFlags).filter(Boolean).length} flagged</span>
                  <span>Target {Math.round(mockAllowedSeconds / 60)}m</span>
                </div>
                <div className="question-meta">
                  <span className="pill">{getQuestionType(mockCurrent.question) === "numeric" ? "NUMERIC" : "MULTIPLE CHOICE"}</span>
                  <button type="button" className={`chip ${mockFlags[mockCurrent.question.id] ? "flagged" : ""}`} onClick={() => toggleMockFlag(mockCurrent.question.id)}>
                    <Flag size={14} /> {mockFlags[mockCurrent.question.id] ? "Flagged" : "Flag"}
                  </button>
                </div>
                <h2>{mockCurrent.question.prompt}</h2>
                {getQuestionType(mockCurrent.question) === "multipleChoice" ? (
                  (mockCurrent.question.choices || []).map((choice, i) => (
                    <button
                      key={choice}
                      className={`choice ${mockAnswers[mockCurrent.question.id]?.answer === i ? "selected" : ""}`}
                      onClick={() => setMockAnswer(mockCurrent.question.id, i)}
                    >
                      <b>{String.fromCharCode(65 + i)}.</b> {choice}
                    </button>
                  ))
                ) : (
                  <label className="numeric-answer" htmlFor="mock-numeric-answer">
                    <span>Final answer {mockCurrent.question.units ? `(${mockCurrent.question.units})` : ""}</span>
                    <input
                      id="mock-numeric-answer"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={String(mockAnswers[mockCurrent.question.id]?.answer ?? "")}
                      onChange={(e) => setMockAnswer(mockCurrent.question.id, e.target.value)}
                      placeholder="Enter numeric answer"
                    />
                  </label>
                )}
                <div className="mock-nav">
                  {mockQuestions.map((item, i) => (
                    <button
                      key={item.question.id}
                      type="button"
                      className={`${i === mockCurrentIndex ? "active" : ""} ${mockAnswers[item.question.id] ? "answered" : ""} ${mockFlags[item.question.id] ? "flagged" : ""}`}
                      onClick={() => setMockCurrentIndex(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="mock-actions">
                  <button className="secondary" disabled={mockCurrentIndex === 0} onClick={() => setMockCurrentIndex((i) => Math.max(0, i - 1))}>Previous</button>
                  {mockCurrentIndex < mockQuestions.length - 1 ? (
                    <button className="primary" onClick={() => setMockCurrentIndex((i) => Math.min(mockQuestions.length - 1, i + 1))}>Next</button>
                  ) : (
                    <button className="primary" onClick={() => void finishMockExam()}>Finish exam</button>
                  )}
                </div>
              </section>
            )}

            {mockResults && (
              <section className="card mock-results">
                <span className="pill"><CheckCircle2 size={13} /> RESULTS</span>
                <h2>Score: {mockScore}%</h2>
                <div className="progress"><div style={{ width: `${mockScore}%` }} /></div>
                <div className="calculator-summary">
                  <div><b>{mockResults.filter((result) => result.isCorrect).length}</b><span>Correct</span></div>
                  <div><b>{mockResults.length - mockResults.filter((result) => result.isCorrect).length}</b><span>Missed</span></div>
                  <div><b>{Math.round(mockElapsedSeconds / Math.max(1, mockResults.length)) || "-"}</b><span>Sec/question</span></div>
                  <div><b>{Math.round(mockReviewSummary.totalTargetSeconds / Math.max(1, mockResults.length))}</b><span>Target sec/question</span></div>
                </div>
                <div className="mock-debrief-grid">
                  <article>
                    <span>Exam decision</span>
                    <b>{mockScore >= 75 ? "Protect this level" : mockScore >= 60 ? "Repair then retest" : "Go back to guided practice"}</b>
                    <p>{mockScore >= 75 ? "Use FE Mode and mixed sets to keep speed sharp." : mockScore >= 60 ? "Review misses, repair the top weak skill, then retake this size." : "Rebuild concepts with guided hints before another timed set."}</p>
                  </article>
                  <article>
                    <span>Answer discipline</span>
                    <b>{mockReviewSummary.unanswered} unanswered</b>
                    <p>{mockReviewSummary.flaggedMisses} flagged question{mockReviewSummary.flaggedMisses === 1 ? "" : "s"} also ended as misses.</p>
                  </article>
                  <article>
                    <span>Retest queue</span>
                    <b>{mockReviewSummary.retestTarget?.skill || "No missed skill"}</b>
                    <p>{mockReviewSummary.retestTarget ? mockReviewSummary.retestTarget.moduleTitle : "Clean set. Move to a larger mock or mixed FE Mode."}</p>
                    {mockReviewSummary.retestTarget && (
                      <button className="chip" onClick={() => practiceWeakSkill(mockReviewSummary.retestTarget!.subjectId, mockReviewSummary.retestTarget!.sectionId, mockReviewSummary.retestTarget!.skill)}>
                        <Wrench size={14} /> Repair this skill
                      </button>
                    )}
                  </article>
                </div>
                <div className="mock-review-grid">
                  <div>
                    <h3>Weak topics</h3>
                    {mockWeakSkills.length ? mockWeakSkills.map(([skill, count]) => <p key={skill} className="note">{skill}: {count} missed</p>) : <p className="note">No weak topic from this set.</p>}
                  </div>
                  <div>
                    <h3>Mistake categories</h3>
                    {mockMistakeCategories.length ? mockMistakeCategories.map(([category, count]) => <p key={category} className="note">{category}: {count}</p>) : <p className="note">No missed-question categories.</p>}
                  </div>
                </div>
                <div className="mock-subject-review">
                  <h3>Subject breakdown</h3>
                  {mockReviewSummary.subjectRows.map((row) => (
                    <div key={row.subjectTitle} className="mock-subject-row">
                      <strong>{row.subjectTitle}</strong>
                      <span>{row.correct}/{row.total} correct</span>
                      <div className="progress"><div style={{ width: `${row.percent}%` }} /></div>
                      <b>{row.percent}%</b>
                    </div>
                  ))}
                </div>
                {mockQuestions.map(({ question }, i) => {
                  const result = mockResults.find((row) => row.questionId === question.id);
                  return (
                    <div key={question.id} className={`fe-review-row ${result?.isCorrect ? "good" : "bad"}`}>
                      <strong>{i + 1}. {question.skill}</strong>
                      <div className="question-tags">
                        <span>{result?.moduleTitle || "Module"}</span>
                        <span>{result?.difficulty || question.difficulty}</span>
                        {question.estimatedSolvingTimeSeconds && <span>{question.estimatedSolvingTimeSeconds}s target</span>}
                        {mockFlags[question.id] && <span>Flagged</span>}
                      </div>
                      <p>{question.prompt}</p>
                      <span className="note">Submitted: {result?.submitted || "No answer"} | Correct: {result?.expected || "No answer"}</span>
                      {!result?.isCorrect && (
                        <div className="feedback bad">
                          <b>Repair note</b>
                          <p>{question.repair}</p>
                          <span className="note">Mistake category: {result?.mistakeCategory || inferMistakeCategory(question.commonMistakes)}</span>
                        </div>
                      )}
                      <div className="feedback good">
                        <b>Solution</b>
                        {question.formulaUsed && <p><b>Formula:</b> <Formula text={question.formulaUsed} /></p>}
                        {question.solution.split("\n").map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
                      </div>
                    </div>
                  );
                })}
                <div className="mock-result-actions">
                  <button className="secondary" onClick={downloadMockExamReport}><FileText size={16} /> Download mock report</button>
                  <button className="primary" onClick={() => startMockExam(mockSize)}>Retake this size</button>
                </div>
              </section>
            )}
          </>
        )}
        {screen === "tutor" && (
          <section className="card tutor-card">
            <div className="split-title">
              <div>
                <span className="pill"><Globe size={13} /> AI TUTOR</span>
                <h2>Mode-aware FE coaching</h2>
              </div>
              <strong>{mastery}%</strong>
            </div>
            <p className="sub">The tutor receives the current subject, topic, mastery, exam date, weak skills, and mistake categories. API keys stay server-side.</p>
            <div className="tutor-context">
              <span>{subject.title}</span>
              <span>{activeModule.title}</span>
              <span>Guided coaching</span>
            </div>
            <div className="tutor-thread">
              {tutorMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`tutor-message ${message.role}`}>
                  <p>{message.content}</p>
                  {message.source && <span>{message.source === "openai" ? "AI" : "Built-in tutor"}</span>}
                </div>
              ))}
            </div>
            <div className="tutor-input-row">
              <input
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void askTutor();
                }}
                placeholder="Ask why you missed it, how to study this topic, or what to review next"
              />
              <button className="primary" disabled={tutorBusy || !tutorInput.trim()} onClick={() => void askTutor()}>
                {tutorBusy ? "Thinking..." : "Ask"}
              </button>
            </div>
            <div className="chip-row">
              <button className="chip" onClick={() => setTutorInput("Explain this concept without giving away the answer.")}>Explain concept</button>
              <button className="chip" onClick={() => setTutorInput("What mistake pattern should I fix first?")}>Mistake pattern</button>
              <button className="chip" onClick={() => setTutorInput("How should I use the FE Reference Handbook for this topic?")}>Handbook help</button>
            </div>
          </section>
        )}
        {screen === "errors" && (
          <>
            <section className="card">
              <div className="split-title">
                <div>
                  <span className="pill"><FileText size={13} /> ERROR NOTEBOOK</span>
                  <h2>{Object.keys(errorNotebook).length} tracked mistake{Object.keys(errorNotebook).length === 1 ? "" : "s"}</h2>
                </div>
                <strong>{errorRows.length}</strong>
              </div>
              <p className="sub">Every wrong guided or FE Mode answer is saved with its mistake category, explanation, topic, and repeat count.</p>
              <div className="notebook-filters">
                <label>
                  <span>Skill</span>
                  <select value={errorFilterSkill} onChange={(e) => setErrorFilterSkill(e.target.value)}>
                    <option value="all">All skills</option>
                    {errorSkills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                  </select>
                </label>
                <label>
                  <span>Category</span>
                  <select value={errorFilterCategory} onChange={(e) => setErrorFilterCategory(e.target.value)}>
                    <option value="all">All categories</option>
                    {errorCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>
            </section>

            {errorRows.length === 0 ? (
              <section className="card repair-empty">
                <h3>No notebook entries yet</h3>
                <p className="sub">Miss a guided or FE Mode question and it will appear here automatically with repair context.</p>
              </section>
            ) : (
              <section className="error-notebook-list">
                {errorRows.map((entry) => (
                  <article key={entry.id} className="card error-entry">
                    <div className="split-title">
                      <div>
                        <span className="pill">{entry.mistakeCategory}</span>
                        <h3>{entry.skill}</h3>
                      </div>
                      <strong>{entry.repeatedMistakes}x</strong>
                    </div>
                    <p><b>Question:</b> {entry.question}</p>
                    <div className="error-answer-grid">
                      <div><span>Your answer</span><b>{entry.studentAnswer}</b></div>
                      <div><span>Correct answer</span><b>{entry.correctAnswer}</b></div>
                    </div>
                    <p className="sub">{entry.explanation}</p>
                    <div className="chip-row">
                      <span className="chip">{entry.moduleTitle}</span>
                      <button type="button" className="chip repair-cta" onClick={() => practiceWeakSkill(entry.subjectId, entry.sectionId, entry.skill)}>
                        <Wrench size={14} /> Repair
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
        {screen === "mastery" && (
          <>
            <div className="card">
              <span className="pill"><Gauge size={13} /> {activeModule.id} MASTERY</span>
              <h2>{mastery}%</h2>
              <div className="progress"><div style={{ width: `${mastery}%` }} /></div>
              <p className="note">Based on {attempts} attempts, recent consistency, mistake severity, and average response time.</p>
              <div className="adaptive-grid">
                <div><b>{activeProgress?.recentResults?.filter(Boolean).length || 0}/{activeProgress?.recentResults?.length || 0}</b><span>Recent correct</span></div>
                <div><b>{activeProgress?.averageResponseTimeSeconds || "-"}</b><span>Avg seconds</span></div>
                <div><b>{readinessStatus(mastery, attempts).label}</b><span>Readiness band</span></div>
              </div>
            </div>
            <div className="card">
              <h3>Priority repair</h3>
              <p><b>{weakest}</b></p>
              <p className="note">Incorrect answers are grouped by skill so repair and retest can target the weakest area.</p>
            </div>
            <div className="card">
              <h3>Mistake pattern</h3>
              {Object.entries(activeProgress?.mistakeCategories || {}).length === 0 ? (
                <p className="note">No mistake categories recorded yet. Missed questions will be grouped here automatically.</p>
              ) : (
                <div className="mistake-list">
                  {Object.entries(activeProgress?.mistakeCategories || {}).map(([category, count]) => (
                    <div key={category} className="mistake-row"><span>{category}</span><b>{count}</b></div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
      <nav className="bottom">
        <button onClick={() => setView("dashboard")}><LayoutDashboard size={19} /> Dashboard</button>
        <button className={screen === "learn" ? "active" : ""} onClick={() => setScreen("learn")}><BookOpen size={19} /> Learn</button>
        <button className={screen === "practice" ? "active" : ""} onClick={() => setScreen("practice")}><Target size={19} /> Practice</button>
        <button className={screen === "tutor" ? "active" : ""} onClick={() => setScreen("tutor")}><Globe size={19} /> Tutor</button>
      </nav>
    </main>
  );
}

function Onboarding({
  user,
  error,
  onComplete,
}: {
  user: User | null;
  error: string;
  onComplete: (draft: ProfileDraft) => Promise<void>;
}) {
  const [discipline, setDiscipline] = useState<FEDiscipline>("mechanical");
  const [examDate, setExamDate] = useState(getDefaultExamDate);
  const [availableStudyHoursPerWeek, setAvailableStudyHoursPerWeek] = useState(8);
  const [diagnosticScores, setDiagnosticScores] = useState<CalculatorScores>({ ...DEFAULT_DIAGNOSTIC_SCORES });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const setupSubjects = DISCIPLINE_SUBJECTS[discipline];

  function changeDiscipline(next: FEDiscipline) {
    setDiscipline(next);
    setDiagnosticScores(Object.fromEntries(DISCIPLINE_SUBJECTS[next].map((subject) => [subject.id, DEFAULT_TARGET_SCORE])));
  }

  function updateDiagnosticScore(id: string, score: number) {
    setDiagnosticScores((current) => ({ ...current, [id]: Math.min(100, Math.max(0, score || 0)) }));
  }

  async function submit() {
    if (!examDate) {
      setLocalError("Choose your FE exam date.");
      return;
    }

    if (availableStudyHoursPerWeek < 1) {
      setLocalError("Enter at least 1 available study hour per week.");
      return;
    }

    try {
      setBusy(true);
      setLocalError("");
      await onComplete({
        discipline,
        examDate,
        availableStudyHoursPerWeek,
        diagnosticScores,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">FE MISSION DREAMS</div>
        <h1 className="title">Set up your FE plan</h1>
        <div className="sub">{user?.email || "Preview profile"} | Phase 2 student account setup</div>
      </header>
      <section className="content onboarding">
        <section className="card hero">
          <span className="pill"><Compass size={13} /> {DISCIPLINE_LABELS[discipline].toUpperCase()}</span>
          <h2>Your first plan starts with the exam date.</h2>
          <p className="sub">These settings drive the dashboard countdown, readiness estimate, and the next adaptive planning phase.</p>
        </section>

        <section className="card setup-card">
          <label htmlFor="discipline">
            <span className="note">FE discipline</span>
            <select id="discipline" value={discipline} onChange={(e) => changeDiscipline(e.target.value as FEDiscipline)}>
              {Object.entries(DISCIPLINE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label htmlFor="setup-exam-date">
            <span className="note">Exam date</span>
            <input id="setup-exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </label>

          <label htmlFor="study-hours">
            <span className="note">Available study hours per week</span>
            <input
              id="study-hours"
              type="number"
              min={1}
              max={60}
              value={availableStudyHoursPerWeek}
              onChange={(e) => setAvailableStudyHoursPerWeek(Math.min(60, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
        </section>

        <section className="card">
          <span className="pill"><Gauge size={13} /> DIAGNOSTIC BASELINE</span>
          <h3>Previous diagnostic scores</h3>
          <p className="sub">Enter estimated percent correct by subject. Leave the default if you have not taken a diagnostic yet.</p>
          <div className="score-list setup-scores">
            {setupSubjects.map((subject) => (
              <label className="score-row" key={subject.id}>
                <span>
                  <b>{subject.title}</b>
                  <small>{subject.examQuestionRange[0]}-{subject.examQuestionRange[1]} questions</small>
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={diagnosticScores[subject.id] ?? DEFAULT_TARGET_SCORE}
                  onChange={(e) => updateDiagnosticScore(subject.id, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </section>

        {(localError || error) && <p className="error" role="alert">{localError || error}</p>}
        <button className="primary" disabled={busy} onClick={submit}><Rocket size={17} /> {busy ? "Saving profile..." : "Build my dashboard"}</button>
      </section>
    </main>
  );
}

function FEExamCalculator({
  subjects,
  disciplineLabel,
  scores,
  targetScore,
  onScoreChange,
  onTargetChange,
  onSelectSubject,
}: {
  subjects: FESubject[];
  disciplineLabel: string;
  scores: CalculatorScores;
  targetScore: number;
  onScoreChange: (id: string, score: number) => void;
  onTargetChange: (score: number) => void;
  onSelectSubject: (id: string) => void;
}) {
  const estimate = useMemo(() => calculateEstimate(subjects, scores), [scores, subjects]);
  const gap = Math.max(0, targetScore - estimate.percent);
  const weakestSubjects = estimate.subjects.slice().sort((a, b) => a.score - b.score).slice(0, 3);

  return (
    <section className="card calculator">
      <div className="split-title">
        <div>
          <span className="pill">FE EXAM CALCULATOR</span>
          <h2>Readiness estimate</h2>
        </div>
        <div className={`score-badge ${estimate.percent >= targetScore ? "ready" : ""}`}>{estimate.percent}%</div>
      </div>
      <p className="sub">Enter your expected percent correct by subject. The app weights each subject by its published {disciplineLabel} question range midpoint for planning.</p>
      <label className="calculator-target" htmlFor="target-score">
        <span>Target score</span>
        <input
          id="target-score"
          type="number"
          min={50}
          max={100}
          value={targetScore}
          onChange={(e) => onTargetChange(Math.min(100, Math.max(50, Number(e.target.value) || DEFAULT_TARGET_SCORE)))}
        />
      </label>
      <div className="calculator-summary">
        <div><b>{estimate.correct}</b><span>Estimated correct</span></div>
        <div><b>{estimate.total}</b><span>Weighted questions</span></div>
        <div><b>{gap ? `${gap}%` : "Ready"}</b><span>{gap ? "Gap to target" : "At or above target"}</span></div>
      </div>
      <div className="score-list">
        {subjects.map((subject) => {
          const value = scores[subject.id] ?? DEFAULT_TARGET_SCORE;
          return (
            <label className="score-row" key={subject.id}>
              <span>
                <b>{subject.title}</b>
                <small>{subject.examQuestionRange[0]}-{subject.examQuestionRange[1]} questions</small>
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onScoreChange(subject.id, Number(e.target.value))}
              />
            </label>
          );
        })}
      </div>
      <div className="feedback good">
        <b>Priority review</b>
        <div className="chip-row">
          {weakestSubjects.map((item) => (
            <button key={item.id} type="button" className="chip" onClick={() => onSelectSubject(item.id)}>{item.title}</button>
          ))}
        </div>
        <span className="note">Tap a subject to jump into it. This is a study estimate only — the real FE uses NCEES scoring, equating, and exam-specific forms.</span>
      </div>
    </section>
  );
}

function calculateEstimate(subjects: FESubject[], scores: CalculatorScores) {
  const rows = subjects.map((subject) => {
    const weight = (subject.examQuestionRange[0] + subject.examQuestionRange[1]) / 2;
    const score = Math.min(100, Math.max(0, scores[subject.id] ?? DEFAULT_TARGET_SCORE));
    return {
      id: subject.id,
      title: subject.title,
      weight,
      score,
      correct: weight * (score / 100),
    };
  });
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  const correct = rows.reduce((sum, row) => sum + row.correct, 0);

  return {
    total: Math.round(total),
    correct: Math.round(correct),
    percent: total ? Math.round((correct / total) * 100) : 0,
    subjects: rows,
  };
}

function friendlyAuthError(e: unknown) {
  if (!(e instanceof FirebaseError)) return "Something went wrong. Please try again.";
  const m: Record<string, string> = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/email-already-in-use": "An account already exists with this email. Try signing in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/popup-closed-by-user": "Google sign-in was canceled.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Please allow pop-ups and try again.",
    "auth/unauthorized-domain": "Google sign-in is not enabled for this website yet.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "We could not reach the sign-in service. Check your connection and try again.",
  };
  return m[e.code] || "We could not sign you in. Please try again.";
}

function Auth({ onPreview }: { onPreview: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  function validate(mode: "login" | "signup") {
    const clean = email.trim();
    if (!clean) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    if (mode === "signup" && password.length < 6) return "Password must be at least 6 characters.";
    return "";
  }

  async function run(mode: "login" | "signup") {
    if (!auth) {
      setError("Firebase is not configured yet. Use preview mode, or add your NEXT_PUBLIC_FIREBASE_* values to .env.local.");
      setNotice("");
      return;
    }

    const v = validate(mode);
    if (v) {
      setError(v);
      setNotice("");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setNotice("");
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!auth) {
      setError("Firebase is not configured yet. Use preview mode, or add your NEXT_PUBLIC_FIREBASE_* values to .env.local.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!auth) {
      setError("Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values before sending password reset emails.");
      return;
    }

    const clean = email.trim();
    if (!clean) {
      setError("Enter your email address first, then tap Forgot password.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await sendPasswordResetEmail(auth, clean);
      setNotice("Password reset email sent. Check your inbox.");
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="authbox">
        <div className="brand">FE MISSION DREAMS</div>
        <h1 className="title">Train smarter for the FE.</h1>
        <p className="sub">Complete FE preparation across Civil, Mechanical, Electrical, Environmental, Chemical, Industrial, and Other Disciplines.</p>
        <div className="card">
          <label htmlFor="email" className="note">Email</label>
          <input id="email" autoComplete="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password" className="note"><Lock size={12} /> Password</label>
          <div className="password-field">
            <input id="password" autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <div className="auth-options">
            <button type="button" className="linkbutton" onClick={reset} disabled={busy}>Forgot password?</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p className="success">{notice}</p>}
          <button className="primary" disabled={busy} onClick={() => run("login")}><LogIn size={17} /> {busy ? "Please wait..." : "Sign in"}</button>
          <div style={{ height: 8 }} />
          <button className="secondary" disabled={busy} onClick={() => run("signup")}><UserPlus size={17} /> Create student account</button>
          <div className="divider">or</div>
          <button className="secondary" disabled={busy} onClick={google}><Globe size={17} /> Continue with Google</button>
          {!auth && (
            <>
              <div className="divider">local</div>
              <button className="secondary preview-button" type="button" onClick={onPreview}><Rocket size={17} /> Continue in preview mode</button>
              <p className="note preview-note">Preview mode skips Firebase and keeps data in this browser session.</p>
            </>
          )}
        </div>
        <p className="note legal-disclaimer">
          FE Mission Dreams is an independent exam-prep product and is not affiliated with, endorsed by, or sponsored by NCEES.
          FE® and NCEES® are trademarks of the National Council of Examiners for Engineering and Surveying.
        </p>
      </div>
    </main>
  );
}
