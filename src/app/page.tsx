"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Compass,
  Eye,
  EyeOff,
  Gauge,
  Globe,
  Layers,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogIn,
  LogOut,
  PlayCircle,
  Rocket,
  Target,
  TrendingUp,
  UserPlus,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { feMechanicalSubjects, totalPlannedSections } from "@/data/fe-mechanical/subjects";
import { moduleRegistry } from "@/data/fe-mechanical/modules";
import type { FESection, FESubject } from "@/types/fe";
import type { StudyModule } from "@/data/module-types";

type ModuleScreen = "home" | "learn" | "flash" | "practice" | "mastery";
type AppView = "dashboard" | "subject" | "module";
type Progress = {
  correct?: number;
  attempts?: number;
  weakSkills?: Record<string, number>;
  lessonIndex?: number;
  subjectId?: string;
  sectionId?: string;
  updatedAt?: { toMillis?: () => number } | null;
};
type CalculatorScores = Record<string, number>;
type SessionFlags = { reviewedFormulas: boolean; solvedProblem: boolean; improvedWeak: boolean };

const DEFAULT_TARGET_SCORE = 70;

function progressUpdatedMs(p?: Progress): number {
  return typeof p?.updatedAt?.toMillis === "function" ? p.updatedAt.toMillis!() : 0;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>("dashboard");
  const [subjectId, setSubjectId] = useState<string>("math");
  const [sectionId, setSectionId] = useState<string>("trigonometry");
  const [screen, setScreen] = useState<ModuleScreen>("home");
  const [qi, setQi] = useState(0);
  const [fi, setFi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [weak, setWeak] = useState<Record<string, number>>({});
  const [lessonIndex, setLessonIndex] = useState(0);
  const [practiceFilter, setPracticeFilter] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [sessionFlags, setSessionFlags] = useState<SessionFlags>({ reviewedFormulas: false, solvedProblem: false, improvedWeak: false });
  const [saveError, setSaveError] = useState("");
  const [targetScore, setTargetScore] = useState(DEFAULT_TARGET_SCORE);
  const [calculatorScores, setCalculatorScores] = useState<CalculatorScores>(() =>
    Object.fromEntries(feMechanicalSubjects.map((subject) => [subject.id, DEFAULT_TARGET_SCORE])),
  );
  const resumedRef = useRef<string | null>(null);

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
            if (p.subjectId && p.sectionId && moduleRegistry[`${p.subjectId}:${p.sectionId}`]) {
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

  const activeModule = moduleRegistry[`${subjectId}:${sectionId}`] || moduleRegistry["math:trigonometry"];
  const practiceQuestions = practiceFilter ? activeModule.questions.filter((question) => question.skill === practiceFilter) : activeModule.questions;
  const q = practiceQuestions[qi] || activeModule.questions[0];
  const mastery = attempts ? Math.round((correct / attempts) * 100) : 0;
  const subject = feMechanicalSubjects.find((s) => s.id === subjectId) || feMechanicalSubjects[0];
  const weakest = useMemo(() => Object.entries(weak).sort((a, b) => b[1] - a[1])[0]?.[0] || "No weakness detected yet", [weak]);
  const liveModules = Object.keys(moduleRegistry).length;
  const sectionCompletion = Math.round((liveModules / totalPlannedSections) * 100);

  const subjectStats = useMemo(() => {
    return feMechanicalSubjects.map((s) => {
      const liveSections = s.sections.filter((sec) => moduleRegistry[`${s.id}:${sec.id}`]);
      let correctSum = 0;
      let attemptsSum = 0;
      let completedCount = 0;
      let currentSection: FESection | null = null;
      let currentModule: StudyModule | null = null;
      let latestMs = -1;

      liveSections.forEach((sec) => {
        const mod = moduleRegistry[`${s.id}:${sec.id}`];
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
          const mod = moduleRegistry[`${s.id}:${sec.id}`];
          return (progressMap[mod.id]?.attempts || 0) < mod.questions.length;
        }) || liveSections[0];
        currentSection = nextUnstarted || null;
        currentModule = nextUnstarted ? moduleRegistry[`${s.id}:${nextUnstarted.id}`] : null;
      }

      const percent = attemptsSum ? Math.round((correctSum / attemptsSum) * 100) : 0;

      return { subject: s, liveSections, percent, completedCount, totalLive: liveSections.length, currentSection, currentModule };
    });
  }, [progressMap]);

  const overallProgress = useMemo(() => {
    let c = 0;
    let a = 0;
    Object.values(progressMap).forEach((p) => {
      c += p.correct || 0;
      a += p.attempts || 0;
    });
    return { percent: a ? Math.round((c / a) * 100) : 0, attempts: a };
  }, [progressMap]);

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
      const found = Object.values(moduleRegistry).find((m) => m.id === lastVisitedModuleId);
      if (found) return found;
    }
    return moduleRegistry["math:trigonometry"];
  }, [lastVisitedModuleId]);

  const continueLessonIdx = Math.min(progressMap[continueModule.id]?.lessonIndex || 0, continueModule.lessons.length - 1);
  const continueLessonTitle = continueModule.lessons[continueLessonIdx]?.title || continueModule.lessons[0].title;

  const globalWeakSkills = useMemo(() => {
    const rows: { moduleId: string; subjectId: string; sectionId: string; moduleTitle: string; skill: string; count: number }[] = [];

    Object.entries(progressMap).forEach(([moduleId, p]) => {
      if (!p.weakSkills || !p.subjectId || !p.sectionId) return;
      const mod = moduleRegistry[`${p.subjectId}:${p.sectionId}`];
      if (!mod) return;

      Object.entries(p.weakSkills).forEach(([skill, count]) => {
        if (count > 0) rows.push({ moduleId, subjectId: p.subjectId!, sectionId: p.sectionId!, moduleTitle: mod.title, skill, count });
      });
    });

    return rows.sort((a, b) => b.count - a.count).slice(0, 8);
  }, [progressMap]);

  useEffect(() => {
    setQi(0);
    setFi(0);
    setSelected(null);
    setChecked(false);
    setFlipped(false);
  }, [activeModule.id, practiceFilter]);

  useEffect(() => {
    const p = progressMap[activeModule.id];
    setCorrect(p?.correct || 0);
    setAttempts(p?.attempts || 0);
    setWeak(p?.weakSkills || {});
    setLessonIndex(p?.lessonIndex || 0);
  }, [activeModule.id, progressMap]);

  useEffect(() => {
    if (screen === "learn" || screen === "flash") {
      setSessionFlags((f) => ({ ...f, reviewedFormulas: true }));
    }
  }, [screen]);

  async function saveProgress(nc: number, na: number, nw: Record<string, number>, li: number) {
    const moduleMastery = na ? Math.round((nc / na) * 100) : 0;

    setProgressMap((prev) => ({
      ...prev,
      [activeModule.id]: {
        correct: nc,
        attempts: na,
        weakSkills: nw,
        lessonIndex: li,
        subjectId: activeModule.subjectId,
        sectionId: activeModule.sectionId,
        updatedAt: { toMillis: () => Date.now() },
      },
    }));

    if (!user || !db) return;

    try {
      setSaveError("");
      await setDoc(doc(db, "users", user.uid, "progress", activeModule.id), {
        moduleId: activeModule.id,
        subjectId: activeModule.subjectId,
        sectionId: activeModule.sectionId,
        correct: nc,
        attempts: na,
        mastery: moduleMastery,
        weakSkills: nw,
        lessonIndex: li,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      setSaveError("Your answer was recorded on this device, but progress could not be saved to Firestore.");
    }
  }

  async function check() {
    if (selected === null || checked) return;

    setChecked(true);
    const ok = selected === q.answer;
    const wasWeak = (weak[q.skill] || 0) > 0;
    const nc = correct + (ok ? 1 : 0);
    const na = attempts + 1;
    const nw = { ...weak };

    if (!ok) {
      nw[q.skill] = (nw[q.skill] || 0) + 1;
    } else if (nw[q.skill]) {
      nw[q.skill] -= 1;
      if (nw[q.skill] <= 0) delete nw[q.skill];
    }

    setCorrect(nc);
    setAttempts(na);
    setWeak(nw);
    setSessionFlags((f) => ({ ...f, solvedProblem: true, improvedWeak: f.improvedWeak || (ok && wasWeak) }));
    await saveProgress(nc, na, nw, lessonIndex);
  }

  async function markLessonReviewed(index: number) {
    const li = Math.max(lessonIndex, index + 1);
    setLessonIndex(li);
    await saveProgress(correct, attempts, weak, li);
  }

  function next() {
    setSelected(null);
    setChecked(false);
    setQi((qi + 1) % practiceQuestions.length);
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

  function updateCalculatorScore(id: string, score: number) {
    setCalculatorScores((current) => ({ ...current, [id]: Math.min(100, Math.max(0, score || 0)) }));
  }

  if (loading) return <main className="auth"><b>Loading FE Mission Dreams...</b></main>;
  if (!user && !process.env.NEXT_PUBLIC_PREVIEW_SKIP_AUTH) return <Auth />;

  if (view === "dashboard") {
    return (
      <main className="shell shell-wide">
        <header className="topbar">
          <div className="brand">FE MISSION DREAMS</div>
          <h1 className="title">Welcome back 👋</h1>
          <div className="sub">Your FE Mechanical journey</div>
        </header>
        <section className="content">
          <div className="dashboard-top">
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

            <section className="card mission-card">
              <span className="pill"><ListChecks size={13} /> TODAY&apos;S MISSION</span>
              <h3>Today&apos;s mission</h3>
              <ul className="mission-list">
                <li className={sessionFlags.reviewedFormulas ? "done" : ""}>{sessionFlags.reviewedFormulas ? <CheckCircle2 size={17} /> : <Circle size={17} />} Review formulas</li>
                <li className={sessionFlags.solvedProblem ? "done" : ""}>{sessionFlags.solvedProblem ? <CheckCircle2 size={17} /> : <Circle size={17} />} Solve problems</li>
                <li className={sessionFlags.improvedWeak ? "done" : ""}>{sessionFlags.improvedWeak ? <CheckCircle2 size={17} /> : <Circle size={17} />} Improve weak skills</li>
              </ul>
            </section>
          </div>

          <section className="dashboard-section">
            <div>
              <span className="pill"><Wrench size={13} /> PRIORITY REPAIR ZONE</span>
              <h2>Weak skills, across every subject</h2>
            </div>
            {globalWeakSkills.length === 0 ? (
              <div className="card repair-empty">
                <p className="sub">No weak skills yet — once you practice a few questions, anything you miss shows up here so you can fix it fast, no matter which subject it's in.</p>
              </div>
            ) : (
              <div className="repair-list">
                {globalWeakSkills.map((row) => (
                  <div key={`${row.moduleId}:${row.skill}`} className="repair-row">
                    <div className="repair-row-info">
                      <span className="repair-count">{row.count}×</span>
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
                      <span className="roadmap-percent">{stat.percent}%</span>
                    </div>
                    <div className="progress"><div style={{ width: `${stat.percent}%` }} /></div>
                    <div className="roadmap-meta">
                      <span>{stat.completedCount} of {stat.totalLive} sections completed</span>
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
            <p className="note">{liveModules} of {totalPlannedSections} planned sections have production modules connected.</p>
          </section>

          <FEExamCalculator
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

  if (view === "subject") {
    const stat = subjectStats.find((s) => s.subject.id === subject.id);

    return (
      <main className="shell">
        <header className="topbar">
          <button className="linkbutton" onClick={() => setView("dashboard")}><ChevronLeft size={15} /> Back to dashboard</button>
          <div className="brand">FE MISSION DREAMS</div>
          <h1 className="title">{subject.title}</h1>
          <div className="sub">FE Mechanical | {subject.sections.length} syllabus sections</div>
        </header>
        <section className="content">
          <div className="card">
            <span className="pill"><Compass size={13} /> SUBJECT MAP</span>
            <h2>{subject.title}</h2>
            <p className="sub">Open a section to study concepts, references, flashcards, FE-style problems, full solutions, repair, retest, and mastery.</p>
          </div>
          <div className="section-list">
            {subject.sections.map((sec) => {
              const mod = moduleRegistry[`${subject.id}:${sec.id}`];
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
        {(["home", "learn", "flash", "practice", "mastery"] as ModuleScreen[]).map((x) => {
          const TabIcon = x === "home" ? LayoutDashboard : x === "learn" ? BookOpen : x === "flash" ? Layers : x === "practice" ? Target : TrendingUp;
          return (
            <button key={x} className={`tab ${screen === x ? "active" : ""}`} onClick={() => { setScreen(x); if (x === "practice") setPracticeFilter(null); }}>
              <TabIcon size={14} /> {x === "flash" ? "Flashcards" : x[0].toUpperCase() + x.slice(1)}
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
              <button className="action" onClick={() => setScreen("learn")}><span className="action-icon"><Calculator size={19} /></span><strong>Formula / Reference</strong><span>FE-ready trig relationships</span></button>
              <button className="action" onClick={() => setScreen("flash")}><span className="action-icon"><Layers size={19} /></span><strong>Flashcards</strong><span>Fast formula recall</span></button>
              <button className="action" onClick={() => { setScreen("practice"); setPracticeFilter(null); }}><span className="action-icon"><Target size={19} /></span><strong>Problems + Solutions</strong><span>FE-style questions with full worked solutions</span></button>
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
                <p key={f.front}><b>{f.front}:</b> {f.back} <span className="note">- {f.note}</span></p>
              ))}
            </div>
            <button className="primary" onClick={() => setScreen("flash")}>Continue to flashcards</button>
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
                  <h2>{activeModule.flashcards[fi].back}</h2>
                  <p>{activeModule.flashcards[fi].note}</p>
                </>
              )}
            </div>
            <button className="primary" onClick={() => {
              setFi((fi + 1) % activeModule.flashcards.length);
              setFlipped(false);
            }}>Next card</button>
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
            <h2>{q.prompt}</h2>
            {q.choices.map((c, i) => {
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
            })}
            {!checked ? (
              <button className="primary" disabled={selected === null} onClick={check}>Check answer</button>
            ) : (
              <>
                <div className={`feedback ${selected === q.answer ? "good" : "bad"}`}>
                  <b>{selected === q.answer ? <><CheckCircle2 size={16} /> Correct - skill strengthened</> : <><XCircle size={16} /> Diagnose: {q.skill}</>}</b>
                  <p>{q.explanation}</p>
                </div>
                <div className="feedback good">
                  <b>Full worked solution</b>
                  {q.solution.split("\n").map((line, i) => <p key={i} style={{ margin: "8px 0" }}>{line}</p>)}
                </div>
                {selected !== q.answer && (
                  <div className="feedback bad">
                    <b>Repair this skill</b>
                    <p>{q.repair}</p>
                    <span className="note">Common trap: {q.trap}</span>
                  </div>
                )}
                <button className="primary" onClick={next}>Next / Retest question</button>
              </>
            )}
          </div>
            )}
          </>
        )}
        {screen === "mastery" && (
          <>
            <div className="card">
              <span className="pill"><Gauge size={13} /> {activeModule.id} MASTERY</span>
              <h2>{mastery}%</h2>
              <div className="progress"><div style={{ width: `${mastery}%` }} /></div>
              <p className="note">Based on {attempts} completed practice attempts.</p>
            </div>
            <div className="card">
              <h3>Priority repair</h3>
              <p><b>{weakest}</b></p>
              <p className="note">Incorrect answers are grouped by skill so repair and retest can target the weakest area.</p>
            </div>
          </>
        )}
      </section>
      <nav className="bottom">
        <button onClick={() => setView("dashboard")}><LayoutDashboard size={19} /> Dashboard</button>
        <button className={screen === "learn" ? "active" : ""} onClick={() => setScreen("learn")}><BookOpen size={19} /> Learn</button>
        <button className={screen === "practice" ? "active" : ""} onClick={() => setScreen("practice")}><Target size={19} /> Practice</button>
        <button className={screen === "mastery" ? "active" : ""} onClick={() => setScreen("mastery")}><TrendingUp size={19} /> Mastery</button>
      </nav>
    </main>
  );
}

function FEExamCalculator({
  scores,
  targetScore,
  onScoreChange,
  onTargetChange,
  onSelectSubject,
}: {
  scores: CalculatorScores;
  targetScore: number;
  onScoreChange: (id: string, score: number) => void;
  onTargetChange: (score: number) => void;
  onSelectSubject: (id: string) => void;
}) {
  const estimate = useMemo(() => calculateEstimate(feMechanicalSubjects, scores), [scores]);
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
      <p className="sub">Enter your expected percent correct by subject. The app weights each subject by its published FE Mechanical question range midpoint for planning.</p>
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
        {feMechanicalSubjects.map((subject) => {
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

function Auth() {
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
      setError("Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values, or set NEXT_PUBLIC_PREVIEW_SKIP_AUTH=true for local preview.");
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
      setError("Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values, or set NEXT_PUBLIC_PREVIEW_SKIP_AUTH=true for local preview.");
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
        <p className="sub">Complete FE Mechanical preparation for desktop and mobile.</p>
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
        </div>
      </div>
    </main>
  );
}
