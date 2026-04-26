import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV2() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const adminNumber = "00923015800630";

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snapshot) => {
      setMatch(snapshot.val());
    });
  }, []);

  const startMatch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const setup = {
      t1: fd.get('t1'),
      t2: fd.get('t2'),
      overs: fd.get('overs'),
      umpire: fd.get('umpire'),
      score: 0, wkts: 0, ov: 0, bl: 0,
      status: "LIVE"
    };
    set(ref(db, 'liveMatch'), setup);
  };

  const updateScore = (runs, type = "N") => {
    if (!isAdmin || !match) return;
    let m = { ...match };
    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
    } else if (type === "W") {
      m.wkts += 1;
      m.bl += 1;
    } else {
      m.score += runs;
      m.bl += 1;
    }
    if (m.bl === 6) { m.ov += 1; m.bl = 0; }
    set(ref(db, 'liveMatch'), m);
  };

  return (
    <div style={s.container}>
      {/* Header with Admin Branding */}
      <div style={s.header}>
        <div style={s.adminInfo}>
          <div style={s.avatar}>T</div>
          <div>
            <div style={s.adminName}>Touqeer Iqbal Baghoor</div>
            <div style={s.tagline}>Umpire System Integrated</div>
          </div>
        </div>
        {!isAdmin && (
          <input 
            type="password" 
            placeholder="PIN" 
            onChange={(e) => e.target.value === "1122" && setIsAdmin(true)}
            style={s.passInput}
          />
        )}
      </div>

      {!match ? (
        isAdmin ? (
          <form onSubmit={startMatch} style={s.card}>
            <h3 style={{color: '#facc15', marginTop: 0}}>Match Setup</h3>
            <input name="t1" placeholder="Batting Team" style={s.input} required />
            <input name="t2" placeholder="Bowling Team" style={s.input} required />
            <input name="overs" placeholder="Total Overs" type="number" style={s.input} required />
            <input name="umpire" placeholder="Umpire Name" style={s.input} />
            <button type="submit" style={s.startBtn}>START LIVE</button>
          </form>
        ) : (
          <div style={s.noMatch}>Intezar Karein... Match Shuru Nahi Hua.</div>
        )
      ) : (
        <div style={s.liveDashboard}>
          <div style={s.mainScoreCard}>
            <div style={s.matchMeta}>Umpire: {match.umpire} | {match.t1} vs {match.t2}</div>
            <div style={s.bigScore}>{match.score}/{match.wkts}</div>
            <div style={s.oversDisplay}>Overs: {match.ov}.{match.bl} / {match.overs}</div>
          </div>

          {isAdmin && (
            <div style={s.adminControls}>
              <div style={s.buttonGrid}>
                {[0, 1, 2, 3, 4, 6].map(n => (
                  <button key={n} onClick={() => updateScore(n)} style={s.runBtn}>{n}</button>
                ))}
                <button onClick={() => updateScore(0, "WD")} style={s.extraBtn}>WD</button>
                <button onClick={() => updateScore(0, "NB")} style={s.extraBtn}>NB</button>
                <button onClick={() => updateScore(0, "W")} style={s.wktBtn}>WKT</button>
              </div>
              <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.resetBtn}>End Match</button>
            </div>
          )}
          
          <div style={s.footerWa}>WhatsApp Updates: {adminNumber}</div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#0a0f1d', minHeight: '100vh', color: 'white', padding: '15px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161d31', padding: '10px', borderRadius: '12px', borderBottom: '2px solid #facc15', marginBottom: '20px' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '35px', height: '35px', background: '#facc15', color: 'black', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  adminName: { fontSize: '14px', fontWeight: 'bold' },
  tagline: { fontSize: '10px', color: '#22c55e' },
  passInput: { width: '50px', background: 'transparent', border: '1px solid #334155', color: 'white', textAlign: 'center', borderRadius: '4px' },
  card: { background: '#161d31', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', boxSizing: 'border-box' },
  startBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  mainScoreCard: { background: 'linear-gradient(180deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '20px', textAlign: 'center', border: '1px solid #1e293b' },
  bigScore: { fontSize: '65px', fontWeight: 'bold', color: '#facc15', margin: '10px 0' },
  matchMeta: { fontSize: '14px', opacity: 0.7, marginBottom: '5px' },
  oversDisplay: { fontSize: '20px' },
  adminControls: { marginTop: '20px', background: '#161d31', padding: '15px', borderRadius: '15px' },
  buttonGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  runBtn: { padding: '18px', background: 'white', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px' },
  extraBtn: { padding: '18px', background: '#facc15', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  wktBtn: { padding: '18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  resetBtn: { width: '100%', padding: '12px', marginTop: '15px', background: '#334155', color: 'white', border: 'none', borderRadius: '10px' },
  footerWa: { textAlign: 'center', marginTop: '20px', fontSize: '12px', opacity: 0.5 },
  noMatch: { textAlign: 'center', marginTop: '100px', fontSize: '18px', opacity: 0.5 }
};
