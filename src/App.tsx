import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotCricketPro() {
  const [match, setMatch] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('live');
  const [showPlayerModal, setShowPlayerModal] = useState<any>(null);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => setMatch(snap.val()));
  }, []);

  // --- CORE ENGINE LOGIC ---
  const updateScore = (runs: number, extras: string = "") => {
    if (!match || !isAdmin) return;
    let m = JSON.parse(JSON.stringify(match));
    let s = m.striker;
    
    if (!s) return alert("Pehle Striker select karein!");

    if (extras === "W") {
      m.wkts += 1;
      m.balls += 1;
      m.striker = null; // New batsman needed
    } else if (extras === "WD" || extras === "NB") {
      m.score += (runs + 1);
      if (extras === "NB") m.freeHit = true;
    } else {
      // Regular Runs
      m.score += runs;
      m.balls += 1;
      m.freeHit = false;
      
      // Update Batsman Stats
      s.runs = (s.runs || 0) + runs;
      s.balls = (s.balls || 0) + 1;
      if (runs === 4) s.fours = (s.fours || 0) + 1;
      if (runs === 6) s.sixes = (s.sixes || 0) + 1;

      // Strike Rotation
      if (runs === 1 || runs === 3) {
        let temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    // Over Management
    if (m.balls >= 6) {
      m.overs += 1;
      m.balls = 0;
      // Change Strike after over
      let temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    set(ref(db, 'liveMatch'), m);
  };

  return (
    <div style={styles.container}>
      {/* Header with Admin Toggle */}
      <header style={styles.header}>
        <div style={styles.brand}>Adhikot Pro <small>v2.0</small></div>
        <button onClick={() => setIsAdmin(!isAdmin)} style={styles.adminToggle}>
          {isAdmin ? "🔒 Lock Admin" : "🔓 Unlock Admin"}
        </button>
      </header>

      {!match ? (
        <div style={styles.empty}>Koi Match Live Nahi Hai. Start karein.</div>
      ) : (
        <div style={styles.content}>
          {/* Score Display Card */}
          <div style={styles.scoreCard}>
            <p>{match.league} | {match.ground}</p>
            <h1 style={styles.mainScore}>{match.score}/{match.wkts}</h1>
            <h3>({match.overs}.{match.balls})</h3>
            <div style={styles.rrBox}>RR: {(match.score / (match.overs + match.balls/6 || 1)).toFixed(2)}</div>
            {match.freeHit && <div style={styles.freeHit}>FREE HIT ⚡</div>}
          </div>

          {/* Individual Batsmen Stats */}
          <div style={styles.statsSection}>
            <div style={styles.playerRow} onClick={() => isAdmin && setShowPlayerModal('striker')}>
              <span>🏏 {match.striker?.name || "Select Striker"}*</span>
              <span>{match.striker?.runs || 0}({match.striker?.balls || 0})</span>
            </div>
            <div style={styles.playerRow} onClick={() => isAdmin && setShowPlayerModal('nonStriker')}>
              <span>🏏 {match.nonStriker?.name || "Select Non-Striker"}</span>
              <span>{match.nonStriker?.runs || 0}({match.nonStriker?.balls || 0})</span>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div style={styles.controls}>
              <div style={styles.grid}>
                {[0,1,2,3,4,6].map(r => (
                  <button key={r} onClick={() => updateScore(r)} style={styles.btn}>{r}</button>
                ))}
              </div>
              <div style={styles.flex}>
                <button onClick={() => updateScore(0, "WD")} style={styles.extraBtn}>WD</button>
                <button onClick={() => updateScore(0, "NB")} style={styles.extraBtn}>NB</button>
                <button onClick={() => updateScore(0, "W")} style={styles.wktBtn}>WICKET</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player Selection Modal */}
      {showPlayerModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Select Batsman</h3>
            {match.team1.players.map((p: any) => (
              <button key={p.name} onClick={() => {
                let m = {...match};
                m[showPlayerModal] = { ...p, runs: 0, balls: 0 };
                set(ref(db, 'liveMatch'), m);
                setShowPlayerModal(null);
              }} style={styles.listBtn}>{p.name}</button>
            ))}
            <button onClick={() => setShowPlayerModal(null)} style={styles.closeBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'Arial' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#1e293b' },
  brand: { color: '#facc15', fontWeight: 'bold', fontSize: '20px' },
  adminToggle: { background: '#334155', border: 'none', color: '#fff', borderRadius: '5px', padding: '5px 10px' },
  scoreCard: { margin: '20px', padding: '30px', background: 'linear-gradient(to bottom, #1e293b, #0f172a)', borderRadius: '20px', textAlign: 'center', border: '1px solid #facc15' },
  mainScore: { fontSize: '60px', margin: '10px 0', color: '#facc15' },
  rrBox: { marginTop: '10px', fontSize: '14px', color: '#94a3b8' },
  statsSection: { margin: '20px', background: '#1e293b', borderRadius: '15px', padding: '10px' },
  playerRow: { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #334155' },
  controls: { padding: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  btn: { padding: '20px', fontSize: '20px', borderRadius: '10px', border: 'none', background: '#fff', color: '#000', fontWeight: 'bold' },
  flex: { display: 'flex', gap: '10px', marginTop: '10px' },
  extraBtn: { flex: 1, padding: '15px', background: '#facc15', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  wktBtn: { flex: 1, padding: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: '#1e293b', padding: '30px', borderRadius: '20px', width: '80%' },
  listBtn: { width: '100%', padding: '15px', marginBottom: '10px', background: '#334155', color: '#fff', border: 'none', borderRadius: '10px' },
  closeBtn: { width: '100%', padding: '10px', background: 'transparent', color: '#94a3b8', border: 'none' },
  freeHit: { color: '#ef4444', fontWeight: 'bold', marginTop: '10px' },
  empty: { textAlign: 'center', marginTop: '100px', color: '#64748b' }
};
