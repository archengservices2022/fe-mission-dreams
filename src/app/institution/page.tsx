"use client";

import { useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  Copy,
  Download,
  Globe,
  GraduationCap,
  LogIn,
  LogOut,
  RefreshCw,
  Rocket,
  UserPlus,
  Users,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { Institution, StudentProfile } from "@/types/fe";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode() {
  return Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

function friendlyAuthError(e: unknown) {
  if (!(e instanceof FirebaseError)) return "Something went wrong. Please try again.";
  const messages: Record<string, string> = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/email-already-in-use": "An account already exists with this email. Try signing in.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/popup-closed-by-user": "Google sign-in was canceled.",
  };
  return messages[e.code] || "Something went wrong. Please try again.";
}

function daysUntil(dateValue?: string) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${dateValue}T00:00:00`);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86400000));
}

function formatTimestamp(value: unknown) {
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  }
  return "Never";
}

function readinessTone(band?: string) {
  if (band === "Ready") return "green";
  if (band === "Weak") return "red";
  if (band === "Developing" || band === "Nearly ready") return "yellow";
  return "empty";
}

type RosterRow = StudentProfile & { id: string };

export default function InstitutionDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [institutionLoading, setInstitutionLoading] = useState(false);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterFetchedAt, setRosterFetchedAt] = useState(0);
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setInstitution(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setInstitutionLoading(true);
        const membershipSnap = await getDoc(doc(db!, "instructorMemberships", user.uid));
        if (cancelled) return;

        if (!membershipSnap.exists()) {
          setInstitution(null);
          return;
        }

        const institutionId = membershipSnap.data().institutionId as string;
        const institutionSnap = await getDoc(doc(db!, "institutions", institutionId));
        if (cancelled) return;
        setInstitution(institutionSnap.exists() ? { id: institutionSnap.id, ...institutionSnap.data() } as Institution : null);
      } catch {
        if (!cancelled) setNotice("Your class could not be loaded. Please try again.");
      } finally {
        if (!cancelled) setInstitutionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!institution || !db) {
      setRoster([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setRosterLoading(true);
        const snap = await getDocs(query(collection(db!, "profiles"), where("institutionId", "==", institution.id)));
        if (cancelled) return;
        const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as RosterRow));
        rows.sort((a, b) => (b.overallAttempts || 0) - (a.overallAttempts || 0));
        setRoster(rows);
        setRosterFetchedAt(Date.now());
      } catch {
        if (!cancelled) setNotice("The class roster could not be loaded. Please try again.");
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [institution]);

  const rosterWithAttempts = useMemo(() => roster.filter((row) => (row.overallAttempts || 0) > 0), [roster]);
  const rosterReadyCount = useMemo(() => roster.filter((row) => row.readinessBand === "Ready").length, [roster]);

  const summary = {
    total: roster.length,
    avgAccuracy: rosterWithAttempts.length
      ? Math.round(rosterWithAttempts.reduce((sum, row) => sum + (row.overallAccuracy || 0), 0) / rosterWithAttempts.length)
      : 0,
    readyCount: rosterReadyCount,
    inactiveCount: roster.filter((row) => {
      const lastActive = row.lastActiveAt as { toDate?: () => Date } | undefined;
      if (!lastActive?.toDate) return true;
      const days = (rosterFetchedAt - lastActive.toDate().getTime()) / 86400000;
      return days >= 7;
    }).length,
  };

  async function createClass() {
    const name = nameDraft.trim();
    if (!name || !user || !db) return;

    setBusy(true);
    setNotice("");

    try {
      const institutionRef = doc(collection(db, "institutions"));
      const code = generateInviteCode();

      await setDoc(institutionRef, {
        name,
        instructorUids: [user.uid],
        inviteCode: code,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "inviteCodes", code), { institutionId: institutionRef.id });
      await setDoc(doc(db, "instructorMemberships", user.uid), { institutionId: institutionRef.id });

      setInstitution({ id: institutionRef.id, name, instructorUids: [user.uid], inviteCode: code, createdBy: user.uid });
      setNameDraft("");
    } catch {
      setNotice("Your class could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCode() {
    if (!institution || !db) return;

    setBusy(true);
    setNotice("");

    try {
      const nextCode = generateInviteCode();
      await setDoc(doc(db, "inviteCodes", nextCode), { institutionId: institution.id });
      await deleteDoc(doc(db, "inviteCodes", institution.inviteCode));
      await setDoc(doc(db, "institutions", institution.id), { inviteCode: nextCode }, { merge: true });
      setInstitution({ ...institution, inviteCode: nextCode });
      setNotice("Invite code regenerated. The old code no longer works.");
    } catch {
      setNotice("The invite code could not be regenerated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!institution) return;
    void navigator.clipboard.writeText(institution.inviteCode);
    setNotice("Invite code copied to clipboard.");
  }

  function exportCsv() {
    const header = ["Student", "Email", "Exam date", "Days until exam", "Readiness", "Accuracy", "Attempts", "Last active"];
    const rows = roster.map((row) => [
      row.displayName || "",
      row.email || "",
      row.examDate || "",
      String(daysUntil(row.examDate) ?? ""),
      row.readinessBand || "",
      String(row.overallAccuracy ?? ""),
      String(row.overallAttempts ?? 0),
      formatTimestamp(row.lastActiveAt),
    ]);
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${institution?.name || "class"}-roster.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (authLoading) return <main className="auth"><b>Loading...</b></main>;

  if (!user) return <InstructorAuth />;

  if (!db) {
    return <main className="auth"><b>Firebase is not configured yet, so the instructor dashboard cannot load class data.</b></main>;
  }

  return (
    <main className="shell shell-wide">
      <header className="topbar">
        <div className="brand">FE MISSION DREAMS</div>
        <h1 className="title">Instructor dashboard</h1>
        <div className="sub">Track cohort readiness across your class, at a glance.</div>
      </header>
      <section className="content">
        {notice && <div className="feedback"><p>{notice}</p></div>}

        {institutionLoading ? (
          <div className="card"><p className="sub">Loading your class...</p></div>
        ) : !institution ? (
          <section className="card class-card">
            <span className="pill"><GraduationCap size={13} /> CREATE A CLASS</span>
            <h2>Set up your class</h2>
            <p className="sub">Give your class a name, then share the invite code with your students so their progress shows up here.</p>
            <div className="billing-actions">
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Class name (e.g. FE Mechanical Review, Fall 2026)" disabled={busy} />
              <button className="primary" disabled={busy || !nameDraft.trim()} onClick={() => void createClass()}>
                <Rocket size={17} /> {busy ? "Creating..." : "Create class"}
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="card class-card">
              <div className="split-title">
                <div>
                  <span className="pill"><Users size={13} /> {institution.name}</span>
                  <h2>Invite code: {institution.inviteCode}</h2>
                </div>
              </div>
              <p className="sub">Share this code with your students. They enter it once on their dashboard to join.</p>
              <div className="billing-actions">
                <button className="secondary" onClick={copyCode}><Copy size={16} /> Copy code</button>
                <button className="secondary" disabled={busy} onClick={() => void regenerateCode()}><RefreshCw size={16} /> {busy ? "Working..." : "Regenerate code"}</button>
              </div>
            </section>

            <section className="metric-grid">
              <div className="metric-card"><b>{summary.total}</b><span>Students joined</span></div>
              <div className="metric-card"><b>{summary.avgAccuracy}%</b><span>Cohort average accuracy</span></div>
              <div className="metric-card"><b>{summary.readyCount}</b><span>Students marked Ready</span></div>
              <div className="metric-card"><b>{summary.inactiveCount}</b><span>Inactive 7+ days</span></div>
            </section>

            <section className="card">
              <div className="split-title">
                <h2>Roster</h2>
                <button className="secondary" disabled={!roster.length} onClick={exportCsv}><Download size={16} /> Export CSV</button>
              </div>
              {rosterLoading ? (
                <p className="sub">Loading roster...</p>
              ) : roster.length === 0 ? (
                <p className="sub">No students have joined yet. Share the invite code above to get started.</p>
              ) : (
                <div className="roster-table-wrap">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Exam date</th>
                        <th>Days left</th>
                        <th>Readiness</th>
                        <th>Accuracy</th>
                        <th>Attempts</th>
                        <th>Last active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.displayName || "Unnamed student"}</strong>
                            <span className="note">{row.email}</span>
                          </td>
                          <td>{row.examDate || "—"}</td>
                          <td>{daysUntil(row.examDate) ?? "—"}</td>
                          <td><span className={`status-pill ${readinessTone(row.readinessBand)}`}>{row.readinessBand || "Needs evidence"}</span></td>
                          <td>{row.overallAccuracy ?? 0}%</td>
                          <td>{row.overallAttempts ?? 0}</td>
                          <td>{formatTimestamp(row.lastActiveAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <button className="secondary" onClick={() => auth && signOut(auth)}><LogOut size={16} /> Sign out</button>
      </section>
    </main>
  );
}

function InstructorAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(mode: "login" | "signup") {
    if (!auth) {
      setError("Firebase is not configured yet.");
      return;
    }

    const clean = email.trim();
    if (!clean || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      if (mode === "signup") await createUserWithEmailAndPassword(auth, clean, password);
      else await signInWithEmailAndPassword(auth, clean, password);
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!auth) {
      setError("Firebase is not configured yet.");
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

  return (
    <main className="auth">
      <div className="authbox">
        <div className="brand">FE MISSION DREAMS</div>
        <h1 className="title">Instructor sign-in</h1>
        <p className="sub">Sign in to create or manage your class dashboard.</p>
        <div className="card">
          <label htmlFor="instructor-email" className="note">Email</label>
          <input id="instructor-email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="instructor-password" className="note">Password</label>
          <input id="instructor-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={busy} onClick={() => void run("login")}><LogIn size={17} /> {busy ? "Please wait..." : "Sign in"}</button>
          <div style={{ height: 8 }} />
          <button className="secondary" disabled={busy} onClick={() => void run("signup")}><UserPlus size={17} /> Create instructor account</button>
          <div className="divider">or</div>
          <button className="secondary" disabled={busy} onClick={google}><Globe size={17} /> Continue with Google</button>
        </div>
      </div>
    </main>
  );
}
