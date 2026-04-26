import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV3() {
  const [match, setMatch] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('live'); // live, scorecard, admin

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => setMatch(snap.val()));
  }, []);

  const updateDB = (newData: any) => set(ref(db, 'liveMatch'), newData);

  const handleBall = (runs: number, isWicket = false, isExtra = false, extraType = "") => {
    if (!match || !isAdmin) return;
    let m = JSON.parse(JSON.stringify(match));
    
    // 1. Basic Score Update
    if (!isExtra) {
      m.score += runs;
      m.balls += 1;
      // Update Batsman Stats
      if (m.striker) {
        m.striker.r += runs;
        m.striker.b += 1;
        if (runs === 4) m.striker.f4 += 1;
        if (runs === 6) m.striker.s6 += 1;
      }
      // Strike Rotation
      if (runs % 2 !== 0) {
        const temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    } else {
      m.score += (runs + 1); // Wide/NB logic
      if (extraType === "NB") {
          m.freeHit = true;
          if(m.striker) { m.striker.r += runs; m.striker.b += 1; }
      }
    }

    // 2. Wicket Logic
    if (isWicket) {
      m.wkts += 1;
      m.balls += 1;
      m.striker = null; // Forces Admin to select new player
    }

    // 3. Over Completion
    if (m.balls >= 6) {
      m.ovs += 1;
      m.balls = 0;
      // Over change rotation
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
      m.currentBowler = null; // New bowler required
    }

    updateDB(m);
  };

  if (!match) return <div style={s.loader}>No Active Match | Waiting for Touqeer...</div>;

  return (
    <div style={s.container}>
      {/* Header Profile */}
      <div style={s.header}>
        <div style={s.profile}>
          <div style={s.avatar}>T</div>
          <div>
            <div style={s.uName}>Touqeer Iqbal Baghoor</div>
            <div style={s.uRole}>Umpire System Integrated</div>
          </div>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)} style={isAdmin ? s.adminOn : s.adminOff}>
          {isAdmin ? "Admin: ON" : "Lock Admin"}
        </button>
      </div>

      {/* Main Scoreboard */}
      <div style={s.scoreCard}>
        <div style={s.meta}>{match.league} • {match.ground}</div>
        <div style={s.bigScore}>{match.score}/{match.wkts}</div>
        <div style={s.overs}>({match.ovs}.{match.balls})</div>
        <div style={s.rr}>CRR: {(match.score / (match.ovs + match.balls/6 || 1)).toFixed(2)}</div>
      </div>

      {/* Batsmen Display */}
      <div style={s.playerGrid}>
        <div style={s.playerBox} onClick={() => isAdmin && setStriker(m)}>
          <div style={s.pName}>{match.striker?.name || "Select Striker"} *</div>
          <div style={s.pStats}>{match.striker?.r || 0}({match.striker?.b || 0})</div>
        </div>
        <div style={s.playerBox}>
          <div style={s.pName}>{match.nonStriker?.name || "Select Non-Striker"}</div>
          <div style={s.pStats}>{match.nonStriker?.r || 0}({match.nonStriker?.b || 0})</div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div style={s.controls}>
          <div style={s.btnRow}>
            {[0, 1, 2, 3, 4, 6].map(r => (
              <button key={r} onClick={() => handleBall(r)} style={s.ballBtn}>{r}</button>
            ))}
          </div>
          <div style={s.btnRow}>
            <button onClick={() => handleBall(0, false, true, "WD")} style={s.extraBtn}>WD</button>
            <button onClick={() => handleBall(0, false, true, "NB")} style={s.extraBtn}>NB</button>
            <button onClick={() => handleBall(0, true)} style={s.wktBtn}>WICKET</button>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div style={s.tabs}>
        <button onClick={() => setView('live')} style={view === 'live' ? s.tabA : s.tab}>LIVE</button>
        <button onClick={() => setView('scorecard')} style={view === 'scorecard' ? s.tabA : s.tab}>SCORECARD</button>
        <button onClick={() => setView('history')} style={view === 'history' ? s.tabA : s.tab}>HISTORY</button>
      </div>
    </div>
  );
}

const s: any = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: '#fff', padding: '10px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #1e293b' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '35px', height: '35px', background: '#facc15', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  uName: { fontSize: '13px', fontWeight: 'bold' },
  uRole: { fontSize: '10px', color: '#22c55e' },
  adminOn: { background: '#22c55e', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 12px', fontSize: '11px' },
  adminOff: { background: '#334155', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 12px', fontSize: '11px' },
  scoreCard: { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', margin: '15px 0', padding: '25px', borderRadius: '15px', textAlign: 'center', border: '1px solid #334155' },
  bigScore: { fontSize: '55px', fontWeight: 'bold', color: '#facc15' },
  overs: { fontSize: '20px', color: '#94a3b8' },
  rr: { marginTop: '10px', fontWeight: 'bold', color: '#facc15' },
  playerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  playerBox: { background: '#161e2e', padding: '15px', borderRadius: '10px', border: '1px solid #334155' },
  pName: { fontSize: '12px', color: '#94a3b8' },
  pStats: { fontSize: '18px', fontWeight: 'bold' },
  controls: { marginTop: '20px' },
  btnRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  ballBtn: { flex: 1, padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' },
  extraBtn: { flex: 1, padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { flex: 2, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  tabs: { display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0f172a', padding: '10px' },
  tab: { flex: 1, background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px' },
  tabA: { flex: 1, background: 'none', border: 'none', color: '#facc15', fontWeight: 'bold', fontSize: '12px' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#facc15' }
};
