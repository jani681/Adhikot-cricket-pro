import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, update } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV6() {
  const [match, setMatch] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [view, setView] = useState('live'); // live, setup, squad
  const [anim, setAnim] = useState(null);
  const [pass, setPass] = useState("");
  const adminWA = "00923015800630";

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(null), 2000); };

  // --- Functions ---
  const startNewMatch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newMatch = {
      t1: fd.get('t1'), t2: fd.get('t2'), ground: fd.get('ground'), 
      totalOvers: parseInt(fd.get('overs')), umpire: fd.get('umpire'),
      score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, target: 0, freeHit: false,
      striker: { name: "Select Striker", runs: 0, balls: 0 },
      nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0 },
      bowler: { name: "Select Bowler", ov: 0, bl: 0, runs: 0, wkts: 0 },
      status: "Match Started"
    };
    set(ref(db, 'liveMatch'), newMatch);
    setView('live');
  };

  const handleBall = (runs, type = "N") => {
    if (!isAuth || !match) return;
    let m = { ...match };
    
    if (runs === 4) triggerAnim("✨ FOUR! ✨");
    if (runs === 6) triggerAnim("🚀 SIXER! 🚀");
    if (type === "W") triggerAnim("☝️ OUT! ☝️");

    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
      m.bowler.runs += (runs + 1);
      m.freeHit = (type === "NB");
    } else {
      m.score += runs;
      m.striker.runs += runs;
      m.striker.balls += 1;
      m.bowler.runs += runs;
      m.bowler.bl += 1;
      m.bl += 1;
      m.freeHit = false;
      if (type === "W") { m.wkts += 1; m.bowler.wkts += 1; m.striker = { name: "New Batsman", runs: 0, balls: 0 }; }
    }

    if (m.bl === 6) { m.ov += 1; m.bl = 0; m.bowler.ov += 1; m.bowler.bl = 0; }
    set(ref(db, 'liveMatch'), m);
  };

  const shareWA = (msg) => {
    window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={st.container}>
      {/* Permanent Admin Header */}
      <div style={st.header}>
        <div style={st.adminProfile}>
          <div style={st.dp}>T</div>
          <div>
            <div style={st.adminName}>Touqeer Iqbal Baghoor</div>
            <div style={st.onlineTag}>● Online Update</div>
          </div>
        </div>
        <div onClick={() => shareWA("Hello Touqeer Bhai, match update chahiye.")} style={st.waIcon}>
          <svg viewBox="0 0 24 24" width="24" fill="#fff"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.001.332.005c.109.004.253-.041.397.303.145.346.491 1.197.534 1.284.044.087.073.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.087-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.174.087.289.13.332.202.045.072.045.419-.1.824z"/></svg>
        </div>
      </div>

      {anim && <div style={st.animOverlay}>{anim}</div>}

      {/* Views */}
      {view === 'setup' ? (
        <form onSubmit={startNewMatch} style={st.card}>
          <h3>New Match Setup</h3>
          <input name="t1" placeholder="Team 1 Name" required style={st.input} />
          <input name="t2" placeholder="Team 2 Name" required style={st.input} />
          <input name="ground" placeholder="Ground Name" style={st.input} />
          <input name="umpire" placeholder="Umpire Name" style={st.input} />
          <input name="overs" type="number" placeholder="Total Overs" style={st.input} />
          <button type="submit" style={st.btnMain}>Start Match</button>
          <button onClick={()=>setView('live')} style={st.btnSec}>Back</button>
        </form>
      ) : match ? (
        <div style={st.matchContainer}>
          {/* Live Scoreboard */}
          <div style={st.card} onClick={() => setView('squad')}>
            <div style={st.matchMeta}>{match.ground} | Umpire: {match.umpire}</div>
            <div style={st.teamsLine}>{match.t1} vs {match.t2}</div>
            <div style={st.bigScore}>{match.score}/{match.wkts}</div>
            <div style={st.oversLine}>({match.ov}.{match.bl} / {match.totalOvers})</div>
            {match.freeHit && <div style={st.freeHit}>⚡ FREE HIT ⚡</div>}
          </div>

          {/* Batsmen & Bowler Stats */}
          <div style={st.statsRow}>
            <div style={st.statBox}>
              <div style={st.label}>Striker</div>
              {isAuth ? <input value={match.striker.name} onChange={(e)=>set(ref(db, 'liveMatch/striker/name'), e.target.value)} style={st.miniInp}/> : <div>{match.striker.name}*</div>}
              <div style={st.val}>{match.striker.runs}({match.striker.balls})</div>
            </div>
            <div style={st.statBox}>
              <div style={st.label}>Bowler</div>
              {isAuth ? <input value={match.bowler.name} onChange={(e)=>set(ref(db, 'liveMatch/bowler/name'), e.target.value)} style={st.miniInp}/> : <div>{match.bowler.name}</div>}
              <div style={st.val}>{match.bowler.wkts}-{match.bowler.runs} ({match.bowler.ov}.{match.bowler.bl})</div>
            </div>
          </div>

          {/* Admin Controls */}
          {isAuth ? (
            <div style={st.controls}>
              <div style={st.grid}>
                {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleBall(r)} style={st.ballBtn}>{r}</button>)}
                <button onClick={()=>handleBall(0, "WD")} style={st.extraBtn}>WD</button>
                <button onClick={()=>handleBall(0, "NB")} style={st.extraBtn}>NB</button>
                <button onClick={()=>handleBall(0, "W")} style={st.wktBtn}>WKT</button>
              </div>
              <button onClick={() => remove(ref(db, 'liveMatch'))} style={st.deleteBtn}>Delete Match</button>
            </div>
          ) : (
            <div style={st.loginRow}>
              <input type="password" placeholder="Admin PIN" onChange={(e)=> e.target.value === "6545" && setIsAuth(true)} style={st.passInp}/>
            </div>
          )}
        </div>
      ) : (
        <div style={st.empty}>
          <p>Koi Match Live Nahi Hai</p>
          <button onClick={()=>setView('setup')} style={st.btnMain}>Create Match</button>
        </div>
      )}
    </div>
  );
}

const st = {
  container: { background: '#0a0f1d', minHeight: '100vh', padding: '15px', color: '#fff', fontFamily: 'Segoe UI, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161d31', padding: '12px', borderRadius: '12px', marginBottom: '20px' },
  adminProfile: { display: 'flex', alignItems: 'center', gap: '10px' },
  dp: { width: '40px', height: '40px', background: 'linear-gradient(45deg, #facc15, #eab308)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' },
  adminName: { fontSize: '14px', fontWeight: 'bold' },
  onlineTag: { fontSize: '10px', color: '#22c55e' },
  waIcon: { background: '#25D366', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' },
  card: { background: '#161d31', padding: '20px', borderRadius: '15px', textAlign: 'center', marginBottom: '15px', cursor: 'pointer' },
  bigScore: { fontSize: '50px', fontWeight: 'bold', color: '#facc15', margin: '10px 0' },
  teamsLine: { fontSize: '18px', fontWeight: '600', opacity: 0.9 },
  statsRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  statBox: { flex: 1, background: '#1e293b', padding: '12px', borderRadius: '10px', textAlign: 'center' },
  label: { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' },
  val: { fontSize: '16px', fontWeight: 'bold' },
  controls: { background: '#161d31', padding: '15px', borderRadius: '15px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  ballBtn: { padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  extraBtn: { padding: '15px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { padding: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' },
  btnMain: { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' },
  animOverlay: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(250,204,21,0.9)', color: '#000', padding: '40px', borderRadius: '20px', fontSize: '40px', fontWeight: '900', zIndex: 100 },
  passInp: { background: 'transparent', border: '1px solid #334155', color: '#fff', textAlign: 'center', width: '100px', borderRadius: '5px' },
  freeHit: { color: '#ef4444', fontWeight: 'bold', animation: 'blink 1s infinite' }
};
