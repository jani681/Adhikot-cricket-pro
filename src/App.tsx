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

export default function AdhikotCricketPro() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('live'); // live, setup, scorecard

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsubscribe = onValue(matchRef, (snap) => {
      setMatch(snap.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleScore = (runs, type = "normal") => {
    if (!match || !isAdmin) return;
    let m = { ...match };

    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
      if (type === "NB") m.freeHit = true;
    } else if (type === "W") {
      m.wkts += 1;
      m.balls += 1;
      m.striker = null; // New batsman selection prompt
    } else {
      m.score += runs;
      m.balls += 1;
      m.freeHit = false;
      // Strike Rotation on odd runs
      if (runs % 2 !== 0) {
        let temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    // Automatic Over Change
    if (m.balls >= 6) {
      m.overs += 1;
      m.balls = 0;
      // Over end strike swap
      let temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    set(ref(db, 'liveMatch'), m);
  };

  if (loading) return <div style={styles.center}>Adhi Kot System Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.userSection}>
          <div style={styles.avatar}>T</div>
          <div>
            <div style={styles.userName}>Touqeer Iqbal Baghoor</div>
            <div style={styles.subText}>Umpire System Integrated</div>
          </div>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)} style={isAdmin ? styles.adminOn : styles.adminOff}>
          {isAdmin ? "Admin: ON" : "Lock Admin"}
        </button>
      </div>

      {!match && !isAdmin && <div style={styles.noMatch}>Koi Match Live Nahi Hai.</div>}

      {/* Setup View for Admin */}
      {isAdmin && !match && (
        <div style={styles.card}>
          <h3 style={{color: '#facc15'}}>Start New Match</h3>
          <button onClick={() => {
            set(ref(db, 'liveMatch'), {
              league: "Local Tournament", ground: "Adhi Kot",
              score: 0, wkts: 0, overs: 0, balls: 0,
              team1: "Team A", team2: "Team B",
              striker: {name: "Player 1", r: 0, b: 0},
              nonStriker: {name: "Player 2", r: 0, b: 0}
            });
          }} style={styles.goldBtn}>Initialize Match</button>
        </div>
      )}

      {/* Main Scoreboard */}
      {match && (
        <div style={styles.scoreArea}>
          <div style={styles.matchMeta}>{match.league} | {match.ground}</div>
          <div style={styles.mainScore}>{match.score}/{match.wkts}</div>
          <div style={styles.overText}>({match.overs}.{match.balls})</div>
          {match.freeHit && <div style={styles.freeHitText}>⚡ FREE HIT</div>}

          <div style={styles.playerGrid}>
            <div style={styles.pBox}>
              <div>{match.striker?.name || "Select Batsman"} *</div>
              <div style={styles.pStats}>{match.striker?.r || 0}({match.striker?.b || 0})</div>
            </div>
            <div style={styles.pBox}>
              <div>{match.nonStriker?.name || "Select Batsman"}</div>
              <div style={styles.pStats}>{match.nonStriker?.r || 0}({match.nonStriker?.b || 0})</div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && match && (
        <div style={styles.controls}>
          <div style={styles.row}>
            {[0, 1, 2, 3, 4, 6].map(r => (
              <button key={r} onClick={() => handleScore(r)} style={styles.numBtn}>{r}</button>
            ))}
          </div>
          <div style={styles.row}>
            <button onClick={() => handleScore(0, "WD")} style={styles.extraBtn}>WD</button>
            <button onClick={() => handleScore(0, "NB")} style={styles.extraBtn}>NB</button>
            <button onClick={() => handleScore(0, "W")} style={styles.wktBtn}>WICKET</button>
          </div>
          <button onClick={() => remove(ref(db, 'liveMatch'))} style={styles.endBtn}>End Match & Save</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: 'white', padding: '15px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' },
  userSection: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '35px', height: '35px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userName: { fontSize: '14px', fontWeight: 'bold' },
  subText: { fontSize: '10px', color: '#22c55e' },
  adminOn: { background: '#22c55e', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px' },
  adminOff: { background: '#334155', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px' },
  scoreArea: { textAlign: 'center', margin: '30px 0', background: 'linear-gradient(to bottom, #1e293b, #0f172a)', padding: '20px', borderRadius: '15px' },
  mainScore: { fontSize: '60px', fontWeight: 'bold', color: '#facc15' },
  overText: { fontSize: '20px', color: '#94a3b8' },
  playerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' },
  pBox: { background: '#161e2e', padding: '10px', borderRadius: '8px', border: '1px solid #334155' },
  pStats: { fontSize: '18px', fontWeight: 'bold', marginTop: '5px' },
  controls: { position: 'fixed', bottom: '20px', left: '15px', right: '15px' },
  row: { display: 'flex', gap: '8px', marginBottom: '10px' },
  numBtn: { flex: 1, padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '18px' },
  extraBtn: { flex: 1, padding: '15px', background: '#facc15', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  wktBtn: { flex: 1, padding: '15px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  endBtn: { width: '100%', padding: '12px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', marginTop: '10px' },
  center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#facc15' },
  noMatch: { textAlign: 'center', marginTop: '100px', color: '#94a3b8' },
  freeHitText: { color: '#ef4444', fontWeight: 'bold', animation: 'pulse 1s infinite' }
};
