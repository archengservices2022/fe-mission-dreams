"use client";

import { useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { flashcards, lessons, questions } from "@/data/math06";

type Screen = "home" | "learn" | "flash" | "practice" | "mastery";
type Progress = { correct?: number; attempts?: number; weakSkills?: Record<string, number> };

export default function Home() {
  const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
  const [screen,setScreen]=useState<Screen>("home"); const [qi,setQi]=useState(0); const [fi,setFi]=useState(0);
  const [flipped,setFlipped]=useState(false); const [selected,setSelected]=useState<number|null>(null); const [checked,setChecked]=useState(false);
  const [correct,setCorrect]=useState(0); const [attempts,setAttempts]=useState(0); const [weak,setWeak]=useState<Record<string,number>>({});
  const [saveError,setSaveError]=useState("");

  useEffect(()=>onAuthStateChanged(auth,async u=>{
    setUser(u);
    if(u){
      try{
        const snap=await getDoc(doc(db,"users",u.uid,"progress","MATH-06"));
        if(snap.exists()){
          const data=snap.data() as Progress;
          setCorrect(data.correct||0); setAttempts(data.attempts||0); setWeak(data.weakSkills||{});
        }
      }catch{ setSaveError("Progress could not be loaded. You can still practice, but Firestore access should be checked."); }
    }else{ setCorrect(0); setAttempts(0); setWeak({}); }
    setLoading(false);
  }),[]);

  const q=questions[qi]; const mastery=attempts?Math.round(correct/attempts*100):0;
  const weakest=useMemo(()=>Object.entries(weak).sort((a,b)=>b[1]-a[1])[0]?.[0]||"No weakness detected yet",[weak]);

  async function saveProgress(nextCorrect:number,nextAttempts:number,nextWeak:Record<string,number>){
    if(!user)return;
    try{
      setSaveError("");
      await setDoc(doc(db,"users",user.uid,"progress","MATH-06"),{moduleId:"MATH-06",correct:nextCorrect,attempts:nextAttempts,mastery:nextAttempts?Math.round(nextCorrect/nextAttempts*100):0,weakSkills:nextWeak,updatedAt:serverTimestamp()},{merge:true});
    }catch{ setSaveError("Your answer was recorded on this device, but progress could not be saved to Firestore."); }
  }

  async function check(){
    if(selected===null||checked)return;
    setChecked(true); const ok=selected===q.answer; const nc=correct+(ok?1:0),na=attempts+1; const nw={...weak};
    if(!ok)nw[q.skill]=(nw[q.skill]||0)+1;
    setCorrect(nc);setAttempts(na);setWeak(nw);await saveProgress(nc,na,nw);
  }
  function next(){setSelected(null);setChecked(false);setQi((qi+1)%questions.length);}

  if(loading)return <main className="auth"><b>Loading FE Mission Dreams…</b></main>;
  if(!user)return <Auth />;
  return <main className="shell">
    <header className="topbar"><div className="brand">FE MISSION DREAMS</div><h1 className="title">MATH-06 · Triangle Trigonometry</h1><div className="sub">FE Mechanical · Learn → Practice → Repair → Master</div></header>
    <div className="tabs">{(["home","learn","flash","practice","mastery"] as Screen[]).map(x=><button key={x} className={`tab ${screen===x?"active":""}`} onClick={()=>setScreen(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
    <section className="content">
      {saveError&&<div className="feedback bad"><b>Progress sync notice</b><p>{saveError}</p></div>}
      {screen==="home"&&<><div className="card hero"><span className="pill">REFERENCE MODULE</span><h2>Build trig confidence for FE day.</h2><p className="sub">Short concept review, active recall, timed-style practice, and targeted repair when you miss a skill.</p><div className="statrow"><div className="stat"><b>{mastery}%</b>Mastery</div><div className="stat"><b>{attempts}</b>Attempts</div><div className="stat"><b>{correct}</b>Correct</div></div></div><div className="grid"><button className="action" onClick={()=>setScreen("learn")}><strong>📘 Learn</strong><span>Core formulas and decision rules</span></button><button className="action" onClick={()=>setScreen("flash")}><strong>⚡ Flashcards</strong><span>Fast formula recall</span></button><button className="action" onClick={()=>setScreen("practice")}><strong>🎯 Practice</strong><span>FE-style questions with diagnosis</span></button><button className="action" onClick={()=>setScreen("mastery")}><strong>📈 Mastery</strong><span>See progress and weak skills</span></button></div></>}
      {screen==="learn"&&<>{lessons.map((l,i)=><article className="card lesson" key={l.title}><span className="pill">LESSON {i+1}</span><h3>{l.title}</h3><p>{l.body}</p></article>)}<button className="primary" onClick={()=>setScreen("flash")}>Continue to flashcards</button></>}
      {screen==="flash"&&<><div className="card flash" onClick={()=>setFlipped(!flipped)}><span className="pill">CARD {fi+1} / {flashcards.length}</span>{!flipped?<><h2>{flashcards[fi].front}</h2><p className="note">Tap card to reveal</p></>:<><h2>{flashcards[fi].back}</h2><p>{flashcards[fi].note}</p></>}</div><button className="primary" onClick={()=>{setFi((fi+1)%flashcards.length);setFlipped(false)}}>Next card</button></>}
      {screen==="practice"&&<><div className="card"><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span className="pill">{q.difficulty.toUpperCase()}</span><span className="note">{qi+1}/{questions.length} · {q.skill}</span></div><h2>{q.prompt}</h2>{q.choices.map((c,i)=>{let cl="choice";if(selected===i)cl+=" selected";if(checked&&i===q.answer)cl+=" correct";if(checked&&selected===i&&i!==q.answer)cl+=" wrong";return <button disabled={checked} className={cl} key={c} onClick={()=>setSelected(i)}><b>{String.fromCharCode(65+i)}.</b> {c}</button>})}{!checked?<button className="primary" disabled={selected===null} onClick={check}>Check answer</button>:<><div className={`feedback ${selected===q.answer?"good":"bad"}`}><b>{selected===q.answer?"Correct — skill strengthened":"Weakness detected: "+q.skill}</b><p>{q.explanation}</p>{selected!==q.answer&&<><b>Repair</b><p>{q.repair}</p><span className="note">Common trap: {q.trap}</span></>}</div><button className="primary" onClick={next}>Next question</button></>}</div></>}
      {screen==="mastery"&&<><div className="card"><span className="pill">MATH-06 MASTERY</span><h2>{mastery}%</h2><div className="progress"><div style={{width:`${mastery}%`}} /></div><p className="note">Based on {attempts} completed practice attempts.</p></div><div className="card"><h3>Priority repair</h3><p><b>{weakest}</b></p><p className="note">Incorrect answers are grouped by skill so future repair questions can target the weakest area.</p></div><button className="secondary" onClick={()=>signOut(auth)}>Sign out</button></>}
    </section>
    <nav className="bottom"><button className={screen==="home"?"active":""} onClick={()=>setScreen("home")}>Home</button><button className={screen==="learn"?"active":""} onClick={()=>setScreen("learn")}>Learn</button><button className={screen==="practice"?"active":""} onClick={()=>setScreen("practice")}>Practice</button><button className={screen==="mastery"?"active":""} onClick={()=>setScreen("mastery")}>Mastery</button></nav>
  </main>;
}

function friendlyAuthError(error:unknown){
  if(!(error instanceof FirebaseError)) return "Something went wrong. Please try again.";
  const messages:Record<string,string>={
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/missing-password":"Please enter your password.",
    "auth/weak-password":"Password must be at least 6 characters.",
    "auth/email-already-in-use":"An account already exists with this email. Try signing in.",
    "auth/invalid-credential":"Email or password is incorrect.",
    "auth/user-not-found":"Email or password is incorrect.",
    "auth/wrong-password":"Email or password is incorrect.",
    "auth/popup-closed-by-user":"Google sign-in was canceled.",
    "auth/popup-blocked":"Your browser blocked the Google sign-in window. Please allow pop-ups and try again.",
    "auth/unauthorized-domain":"Google sign-in is not enabled for this website yet.",
    "auth/too-many-requests":"Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed":"We could not reach the sign-in service. Check your connection and try again."
  };
  return messages[error.code]||"We could not sign you in. Please try again.";
}

function Auth(){
  const[email,setEmail]=useState(""); const[password,setPassword]=useState(""); const[error,setError]=useState(""); const[notice,setNotice]=useState("");
  const[showPassword,setShowPassword]=useState(false); const[busy,setBusy]=useState(false);
  function validate(mode:"login"|"signup"){
    const clean=email.trim();
    if(!clean)return "Please enter your email address.";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))return "Please enter a valid email address.";
    if(!password)return "Please enter your password.";
    if(mode==="signup"&&password.length<6)return "Password must be at least 6 characters.";
    return "";
  }
  async function run(mode:"login"|"signup"){
    const validation=validate(mode); if(validation){setError(validation);setNotice("");return;}
    try{setBusy(true);setError("");setNotice("");if(mode==="signup")await createUserWithEmailAndPassword(auth,email.trim(),password);else await signInWithEmailAndPassword(auth,email.trim(),password)}catch(e){setError(friendlyAuthError(e))}finally{setBusy(false)}
  }
  async function google(){try{setBusy(true);setError("");setNotice("");await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){setError(friendlyAuthError(e))}finally{setBusy(false)}}
  async function resetPassword(){
    const clean=email.trim(); setNotice("");
    if(!clean){setError("Enter your email address first, then tap Forgot password.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)){setError("Please enter a valid email address.");return;}
    try{setBusy(true);setError("");await sendPasswordResetEmail(auth,clean);setNotice("Password reset email sent. Check your inbox.")}catch(e){setError(friendlyAuthError(e))}finally{setBusy(false)}
  }
  return <main className="auth"><div className="authbox"><div className="brand">FE MISSION DREAMS</div><h1 className="title">Train smarter for the FE.</h1><p className="sub">Your first mission: MATH-06 Triangle Trigonometry.</p><div className="card">
    <label htmlFor="email" className="note">Email</label><input id="email" autoComplete="email" inputMode="email" type="email" placeholder="you@example.com" value={email} onChange={e=>{setEmail(e.target.value);setError("")}}/>
    <label htmlFor="password" className="note">Password</label><input id="password" autoComplete="current-password" type={showPassword?"text":"password"} placeholder="Password" value={password} onChange={e=>{setPassword(e.target.value);setError("")}} onKeyDown={e=>{if(e.key==="Enter")run("login")}}/>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",margin:"-4px 0 14px"}}><label className="note" style={{display:"flex",gap:7,alignItems:"center"}}><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)} style={{width:"auto",margin:0}}/> Show password</label><button type="button" className="linkbutton" onClick={resetPassword} disabled={busy}>Forgot password?</button></div>
    {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="success" role="status">{notice}</p>}
    <button className="primary" disabled={busy} onClick={()=>run("login")}>{busy?"Please wait…":"Sign in"}</button><div style={{height:8}}/><button className="secondary" disabled={busy} onClick={()=>run("signup")}>Create student account</button><div className="divider">or</div><button className="secondary" disabled={busy} onClick={google}>Continue with Google</button>
  </div></div></main>
}
