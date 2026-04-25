import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ADMIN CONFIG
const ADMIN_NAME = "Touqeer Iqbal";
const ADMIN_DP = "https://i.ibb.co/vzYyLz7/touqeer.jpg";
const ADMIN_WA = "923015800630";

export default function AdhiKotUltimateCricket() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // Admin Toggle
  const [view, setView] = useState<'live' | 'history' | 'setup'>('live');
  const [animation, setAnimation] = useState("");

  useEffect(() => {
    // Sync Live Match
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    // Sync History
    onValue(ref(db, 'matchHistory'), (snap) => {
      const data = snap.val();
      if (data) setHistory(Object.values(data));
    });
  }, []);

  const triggerAnimation = (text: string) => {
    setAnimation(text);
    setTimeout(() => setAnimation(""), 2500);
  };

  const handleCreateMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }));
    const pB = (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }));

    const newMatch = {
      id: Date.now(),
      leagueName: fd.get("league") || "Local Match",
      ground: fd.get("ground") || "Adhi Kot Stadium",
      dateTime: `${fd.get("date")} ${fd.get("time")}`,
      umpire: fd.get("umpire") || "Neutral",
      oversTotal: parseInt(fd.get("overs") as string) || 5,
      teamA: { name: fd.get("tA"), players: pA },
      teamB: { name: fd.get("tB"), players: pB },
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1,
      striker: { name: pA[0].name, idx: 0, runs: 0, balls: 0 },
      nonStriker: { name: pA[1].name, idx: 1, runs: 0, balls: 0 },
      bowler: { name: pB[0].name, runs: 0, wkts: 0, balls: 0 },
      status: "Live"
    };
    set(ref(db, 'liveMatch'), newMatch);
    setView('live');
  };

  const updateScore = (runs: number, type = "normal") => {
    if (!match || !isAdmin) return;
    let m = { ...match };
    
    if (type === "W") {
      m.wickets += 1;
      m.balls += 1;
      m.bowler.balls += 1;
      triggerAnimation("☝️ OUT!");
    } else if (type === "WD" || type === "NB") {
      m.score += (1 + runs);
      m.bowler.runs += (1 + runs);
      if (type === "NB") triggerAnimation("🆓 FREE HIT!");
    } else {
      m.score += runs;
      m.balls += 1;
      m.striker.runs += runs;
      m.striker.balls += 1;
      m.bowler.runs += runs;
      m.bowler.balls += 1;
      if (runs === 4) triggerAnimation("🏏 FOUR!");
      if (runs === 6) triggerAnimation("🚀 SIXER!");
    }

    // Over Change
    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
    }

    set(ref(db, 'liveMatch'), m);
  };

  const saveToHistory = () => {
    if (match) {
      push(ref(db, 'matchHistory'), { ...match, status: "Completed" });
      remove(ref(db, 'liveMatch'));
      alert("Match Saved to Records!");
    }
  };

  return (
    <div style={st.container}>
      {/* HEADER */}
      <div style={st.header}>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <img src={ADMIN_DP} style={st.adminDp} onClick={() => setIsAdmin(!isAdmin)} title="Tap to Toggle Admin" />
          <div>
            <div style={st.appTitle}>ADHI KOT CRICKET PRO</div>
            <div style={st.adminTag}>{isAdmin ? "ADMIN MODE" : "VIEWER MODE"}</div>
          </div>
        </div>
        <div style={{display:'flex', gap:'5px'}}>
           <button onClick={() => setView('live')} style={st.navBtn}>Live</button>
           <button onClick={() => setView('history')} style={st.navBtn}>History</button>
           {isAdmin && <button onClick={() => setView('setup')} style={st.navBtn}>+</button>}
        </div>
      </div>

      {/* VIEW: SETUP */}
      {view === 'setup' && (
        <form onSubmit={handleCreateMatch} style={st.form}>
          <input name="league" placeholder="League Name" style={st.inp} required />
          <div style={{display:'flex', gap:'5px'}}>
            <input name="date" type="date" style={st.inp} required />
            <input name="time" type="time" style={st.inp} required />
          </div>
          <input name="ground" placeholder="Ground Name" style={st.inp} required />
          <input name="umpire" placeholder="Umpire Name" style={st.inp} />
          <input name="overs" placeholder="Overs" type="number" style={st.inp} required />
          <input name="tA" placeholder="Batting Team" style={st.inp} required />
          <textarea name="pA" placeholder="Players (Ali, Ahmed...)" style={st.area} required />
          <input name="tB" placeholder="Bowling Team" style={st.inp} required />
          <textarea name="pB" placeholder="Players (Zaid, Khan...)" style={st.area} required />
          <button type="submit" style={st.mainBtn}>CREATE MATCH</button>
        </form>
      )}

      {/* VIEW: LIVE SCORECARD */}
      {view === 'live' && match && (
        <div style={st.card}>
          <div style={st.matchInfo}>
            {match.leagueName} | {match.ground} <br/>
            Umpire: {match.umpire} | {match.dateTime}
          </div>
          <div style={st.mainScore}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>
          
          <div style={st.statsBox}>
             <div style={st.statRow}>🏏 {match.striker.name}* <span>{match.striker.runs}({match.striker.balls})</span></div>
             <div style={st.statRow}>🏏 {match.nonStriker.name} <span>{match.nonStriker.runs}({match.nonStriker.balls})</span></div>
             <div style={st.statRowBowl}>⚪ {match.bowler.name} <span>{match.bowler.wkts} Wkts / {match.bowler.runs} Runs</span></div>
          </div>

          {isAdmin && (
            <div style={st.controls}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={st.scoreBtn}>{n}</button>)}
              <button onClick={()=>updateScore(0,"WD")} style={st.extraBtn}>WD</button>
              <button onClick={()=>updateScore(0,"NB")} style={st.extraBtn}>NB</button>
              <button onClick={()=>updateScore(0,"W")} style={st.wktBtn}>WICKET</button>
              <button onClick={saveToHistory} style={st.saveBtn}>SAVE MATCH</button>
            </div>
          )}
          <a href={`https://wa.me/${ADMIN_WA}`} style={st.waFloat}>Contact Admin</a>
        </div>
      )}

      {/* VIEW: HISTORY */}
      {view === 'history' && (
        <div style={{padding:'10px'}}>
          <h3 style={{color:'#f5cd11'}}>Match Records</h3>
          {history.length === 0 && <p>No records found.</p>}
          {history.map((h, i) => (
            <div key={i} style={st.historyCard}>
              <div style={{fontWeight:'bold'}}>{h.teamA.name} vs {h.teamB.name}</div>
              <div style={{fontSize:'12px'}}>{h.leagueName} | {h.dateTime}</div>
              <div style={{color:'#f5cd11'}}>Result: {h.score}/{h.wickets} in {h.overs} Overs</div>
            </div>
          ))}
        </div>
      )}

      {animation && <div style={st.aniOverlay}>{animation}</div>}
    </div>
  );
}

const st: any = {
  container: { background: '#0a0f1e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#161d31', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f5cd11' },
  adminDp: { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f5cd11' },
  appTitle: { fontSize: '14px', fontWeight: 'bold', color: '#f5cd11' },
  adminTag: { fontSize: '10px', color: '#94a3b8' },
  navBtn: { background: '#334155', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' },
  form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  inp: { padding: '12px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '8px' },
  area: { padding: '12px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '8px', height: '60px' },
  mainBtn: { background: '#f5cd11', color: 'black', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  card: { margin: '15px', padding: '20px', background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  matchInfo: { textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginBottom: '15px' },
  mainScore: { fontSize: '60px', textAlign: 'center', fontWeight: 'bold', textShadow: '2px 2px 10px rgba(245,205,17,0.3)' },
  statsBox: { background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', marginTop: '20px' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' },
  statRowBowl: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#f5cd11' },
  controls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' },
  scoreBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  extraBtn: { background: '#f5cd11', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 2', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  saveBtn: { gridColumn: 'span 4', background: '#10b981', color: 'white', padding: '10px', marginTop: '10px', border: 'none', borderRadius: '10px' },
  waFloat: { display: 'block', textAlign: 'center', marginTop: '15px', color: '#25D366', textDecoration: 'none', fontSize: '12px' },
  historyCard: { background: '#161d31', padding: '15px', borderRadius: '10px', marginBottom: '10px', borderLeft: '4px solid #f5cd11' },
  aniOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', color: '#f5cd11', fontWeight: 'bold', zIndex: 999 }
};
