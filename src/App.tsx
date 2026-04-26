import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotCricketPro() {
  const [match, setMatch] = useState(null);
  const [adminPass, setAdminPass] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [animation, setAnimation] = useState(null);
  const [view, setView] = useState('live'); // live, history, setup
  const [history, setHistory] = useState({});

  // Setup State
  const [setup, setSetup] = useState({
    league: "", team1: "", team2: "", t1_players: "", t2_players: "", 
    umpire: "", totalOvers: 10, startTime: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'history'), (snap) => setHistory(snap.val() || {}));
  }, []);

  // WhatsApp Logic
  const shareToWhatsApp = (playerPhone, msg) => {
    const url = `https://wa.me/${playerPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const generateMatchUpdate = () => {
    if (!match) return "";
    return `🏏 Live Update: ${match.team1} vs ${match.team2}\nScore: ${match.score}/${match.wkts}\nOvers: ${match.overs}.${match.balls}\nUmpire: ${match.umpire}\nLive on Adhikot Pro!`;
  };

  // Scoring Logic
  const handleBall = (runs, type = "normal") => {
    if (!match || !isAuthorized) return;
    let m = JSON.parse(JSON.stringify(match));
    
    // Animation Trigger
    if (runs === 4) triggerAnim("FOUR! ✨");
    if (runs === 6) triggerAnim("SIXER! 🚀");
    if (type === "W") triggerAnim("OUT! ☝️");

    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
      if (type === "NB") m.freeHit = true;
    } else if (type === "W") {
      m.wkts += 1;
      m.balls += 1;
      m.freeHit = false;
      m.striker.out = true;
    } else {
      m.score += runs;
      m.balls += 1;
      m.striker.r += runs;
      m.striker.b += 1;
      m.freeHit = false;
      if (runs % 2 !== 0) rotateStrike(m);
    }

    if (m.balls >= 6) {
      m.overs += 1;
      m.balls = 0;
      rotateStrike(m);
    }

    set(ref(db, 'liveMatch'), m);
  };

  const rotateStrike = (m) => {
    let temp = m.striker;
    m.striker = m.nonStriker;
    m.nonStriker = temp;
  };

  const triggerAnim = (txt) => {
    setAnimation(txt);
    setTimeout(() => setAnimation(null), 2500);
  };

  const startMatch = () => {
    const newMatch = {
      ...setup,
      score: 0, wkts: 0, overs: 0, balls: 0,
      striker: { name: setup.t1_players.split(',')[0], r: 0, b: 0, phone: "92300000000" },
      nonStriker: { name: setup.t1_players.split(',')[1], r: 0, b: 0, phone: "92300000001" },
      bowler: { name: setup.t2_players.split(',')[0], o: 0, r: 0, w: 0 },
      freeHit: false,
      status: "LIVE"
    };
    set(ref(db, 'liveMatch'), newMatch);
    setView('live');
  };

  const saveAndEnd = () => {
    push(ref(db, 'history'), match);
    remove(ref(db, 'liveMatch'));
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.profile}>
          <div style={styles.avatar}>T</div>
          <div>
            <div style={styles.name}>Touqeer Iqbal Baghoor</div>
            <div style={styles.status}>🟢 Umpire System Integrated</div>
          </div>
        </div>
        {view !== 'setup' && <button onClick={() => setView('setup')} style={styles.matchBtn}>+ Match</button>}
      </div>

      {/* Navigation */}
      <div style={styles.tabs}>
        <button onClick={() => setView('live')} style={view === 'live' ? styles.tabActive : styles.tab}>LIVE</button>
        <button onClick={() => setView('history')} style={view === 'history' ? styles.tabActive : styles.tab}>HISTORY</button>
        {!isAuthorized && (
          <div style={styles.adminLock}>
            <input type="password" placeholder="Pass" onChange={(e) => e.target.value === "6545" && setIsAuthorized(true)} style={styles.passInput} />
          </div>
        )}
      </div>

      {/* Animation Overlay */}
      {animation && <div style={styles.animOverlay}>{animation}</div>}

      {/* Main Content */}
      {view === 'live' && match && (
        <div style={styles.scoreCard}>
          <div style={styles.meta}>{match.league} | Umpire: {match.umpire || "N/A"}</div>
          <div style={styles.mainScore}>{match.score}/{match.wkts} <span style={styles.overs}>({match.overs}.{match.balls})</span></div>
          <div style={styles.rr}>CRR: {(match.score / (match.overs + match.balls/6) || 0).toFixed(2)}</div>
          
          {match.freeHit && <div style={styles.freeHit}>⚡ FREE HIT</div>}

          {/* Players Stats */}
          <div style={styles.playerRow}>
            <div style={styles.pInfo}>🏏 {match.striker.name}*</div>
            <div style={styles.pStats}>{match.striker.r}({match.striker.b})</div>
            <button onClick={() => shareToWhatsApp(match.striker.phone, generateMatchUpdate())} style={styles.waIcon}>💬</button>
          </div>
          <div style={styles.playerRow}>
            <div style={styles.pInfo}>🏏 {match.nonStriker.name}</div>
            <div style={styles.pStats}>{match.nonStriker.r}({match.nonStriker.b})</div>
          </div>
          <div style={styles.playerRow} style={{borderTop: '1px solid #334155', marginTop: '10px'}}>
            <div style={styles.pInfo}>🥎 {match.bowler.name}</div>
            <div style={styles.pStats}>{match.bowler.o}-{match.bowler.r}-{match.bowler.w}</div>
          </div>

          {/* Admin Controls */}
          {isAuthorized && (
            <div style={styles.controls}>
              <div style={styles.grid}>
                {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleBall(n)} style={styles.btn}>{n}</button>)}
                <button onClick={() => handleBall(0, "WD")} style={styles.extraBtn}>WD</button>
                <button onClick={() => handleBall(0, "NB")} style={styles.extraBtn}>NB</button>
                <button onClick={() => handleBall(0, "W")} style={styles.wktBtn}>WKT</button>
              </div>
              <button onClick={saveAndEnd} style={styles.saveBtn}>END & SAVE MATCH</button>
            </div>
          )}
        </div>
      )}

      {view === 'setup' && isAuthorized && (
        <div style={styles.setupForm}>
          <input placeholder="League Name" onChange={e => setSetup({...setup, league: e.target.value})} style={styles.input}/>
          <input placeholder="Team 1 Name" onChange={e => setSetup({...setup, team1: e.target.value})} style={styles.input}/>
          <textarea placeholder="T1 Players (Comma separated)" onChange={e => setSetup({...setup, t1_players: e.target.value})} style={styles.input}/>
          <input placeholder="Team 2 Name" onChange={e => setSetup({...setup, team2: e.target.value})} style={styles.input}/>
          <textarea placeholder="T2 Players (Comma separated)" onChange={e => setSetup({...setup, t2_players: e.target.value})} style={styles.input}/>
          <input placeholder="Umpire Name" onChange={e => setSetup({...setup, umpire: e.target.value})} style={styles.input}/>
          <button onClick={startMatch} style={styles.startBtn}>START MATCH</button>
        </div>
      )}

      {view === 'history' && (
        <div style={styles.historyList}>
          {Object.values(history).map((h, i) => (
            <div key={i} style={styles.hCard}>
              <div>{h.team1} vs {h.team2}</div>
              <div style={{color: '#facc15'}}>{h.score}/{h.wkts} ({h.overs})</div>
              <button onClick={() => remove(ref(db, `history/${Object.keys(history)[i]}`))} style={styles.delBtn}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {!match && view === 'live' && <div style={styles.noMatch}>Koi Match Live Nahi Hai.</div>}
    </div>
  );
}

const styles = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', padding: '15px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  name: { fontSize: '14px', fontWeight: 'bold' },
  status: { fontSize: '10px', color: '#22c55e' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' },
  tab: { flex: 1, padding: '10px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '5px' },
  tabActive: { flex: 1, padding: '10px', background: '#facc15', border: 'none', color: 'black', borderRadius: '5px', fontWeight: 'bold' },
  scoreCard: { background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '15px', textAlign: 'center', position: 'relative' },
  mainScore: { fontSize: '48px', fontWeight: 'bold', color: '#facc15', margin: '10px 0' },
  overs: { fontSize: '20px', color: '#94a3b8' },
  playerRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b', alignItems: 'center' },
  waIcon: { background: '#25d366', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' },
  animOverlay: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(250, 204, 21, 0.9)', color: 'black', padding: '20px 40px', borderRadius: '50px', fontSize: '32px', fontWeight: 'bold', zIndex: 100, animation: 'bounce 0.5s infinite' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' },
  btn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  extraBtn: { padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '5px' },
  startBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  passInput: { width: '60px', padding: '5px', background: '#0f172a', border: '1px solid #facc15', color: 'white', fontSize: '10px' },
  freeHit: { color: '#ef4444', fontWeight: 'bold', marginTop: '10px' }
};
