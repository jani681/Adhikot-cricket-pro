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

export default function AdhikotStablePro() {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('live'); 
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsubscribe = onValue(matchRef, (snap) => {
      setMatch(snap.val()); // Null aayega agar match nahi hai
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const startNewMatch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    // Comma separated players list
    const batPlayers = fd.get('batPlayers').split(',').map(p => p.trim()).filter(p => p);
    const bowlPlayers = fd.get('bowlPlayers').split(',').map(p => p.trim()).filter(p => p);

    const newMatchData = {
      league: fd.get('league') || "Local Tournament",
      totalOvers: parseInt(fd.get('overs')) || 10,
      t1: fd.get('batTeam'),
      t2: fd.get('bowlTeam'),
      score: 0, wkts: 0, ov: 0, bl: 0, target: 0,
      striker: { name: batPlayers[0] || "Select Striker", r: 0, b: 0 },
      nonStriker: { name: batPlayers[1] || "Select Non-Striker", r: 0, b: 0 },
      bowler: { name: bowlPlayers[0] || "Select Bowler", o: 0, r: 0, w: 0 },
      freeHit: false
    };
    
    set(ref(db, 'liveMatch'), newMatchData);
    setView('live');
  };

  const handleBall = (runs, type = "normal") => {
    if (!isAdmin || !match) return;
    let m = { ...match };

    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
      m.freeHit = (type === "NB");
    } else if (type === "W") {
      m.wkts += 1;
      m.bl += 1;
      m.freeHit = false;
    } else {
      m.score += runs;
      m.bl += 1;
      m.striker.r += runs;
      m.striker.b += 1;
      m.freeHit = false;
      // Strike rotation logic
      if (runs % 2 !== 0) {
        let temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    if (m.bl >= 6) {
      m.ov += 1;
      m.bl = 0;
      // Over change strike rotation
      let temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    set(ref(db, 'liveMatch'), m);
  };

  const shareWhatsApp = () => {
    if(!match) return;
    const msg = `🏏 *Live Match Update*\n\n*${match.t1}* vs *${match.t2}*\nScore: ${match.score}/${match.wkts} (${match.ov}.${match.bl} Overs)\nStriker: ${match.striker.name} - ${match.striker.r}(${match.striker.b})\n\n_Powered by Adhikot Pro_`;
    window.open(`https://wa.me/00923015800630?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div style={styles.center}>Adhikot System Loading...</div>;

  return (
    <div style={styles.container}>
      {/* App Header */}
      <div style={styles.header}>
        <div style={styles.userRow}>
          <div style={styles.avatar}>T</div>
          <div>
            <div style={styles.userName}>Touqeer Iqbal Baghoor</div>
            <div style={styles.onlineText}>🟢 WhatsApp Integrated: 00923015800630</div>
          </div>
        </div>
        {!match && <button onClick={() => setView('setup')} style={styles.setupBtn}>+ Match</button>}
      </div>

      {/* Admin Login Area */}
      {!isAdmin && (
        <div style={{textAlign: 'right', marginBottom: '10px'}}>
          <input 
            type="password" 
            placeholder="Admin PIN" 
            onChange={(e) => { if(e.target.value === "6545") setIsAdmin(true); }} 
            style={styles.pinInput}
          />
        </div>
      )}

      {/* MATCH SETUP FORM (Same as your screenshot) */}
      {view === 'setup' && !match && isAdmin && (
        <form onSubmit={startNewMatch} style={styles.card}>
          <h3 style={{marginTop: 0, color: '#facc15'}}>Match Settings</h3>
          <input name="league" placeholder="League Name (e.g. Adhi Kot Cup)" style={styles.input} />
          <input name="overs" type="number" placeholder="Total Overs" style={styles.input} required />
          <input name="batTeam" placeholder="Batting Team" style={styles.input} required />
          <textarea name="batPlayers" placeholder="Batsmen (Ali, Ahmed...)" style={styles.area} required />
          <input name="bowlTeam" placeholder="Bowling Team" style={styles.input} required />
          <textarea name="bowlPlayers" placeholder="Bowlers (Zaid, Khan...)" style={styles.area} required />
          <button type="submit" style={styles.startBtn}>Start Match</button>
        </form>
      )}

      {/* LIVE SCOREBOARD */}
      {view === 'live' && match && (
        <div style={styles.liveContainer}>
          <div style={styles.boardCard}>
            <div style={styles.teams}>{match.t1} vs {match.t2}</div>
            <div style={styles.mainScore}>{match.score}/{match.wkts}</div>
            <div style={styles.oversText}>({match.ov}.{match.bl} / {match.totalOvers})</div>
            {match.freeHit && <div style={styles.freeHitText}>⚡ FREE HIT</div>}
            
            <button onClick={shareWhatsApp} style={styles.waBtn}>💬 Send WhatsApp Update</button>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Striker</div>
              <div style={styles.statValue}>🏏 {match.striker.name}*</div>
              <div style={styles.statRuns}>{match.striker.r}({match.striker.b})</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Non-Striker</div>
              <div style={styles.statValue}>🏏 {match.nonStriker.name}</div>
              <div style={styles.statRuns}>{match.nonStriker.r}({match.nonStriker.b})</div>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div style={styles.controlsBlock}>
              <div style={styles.btnGrid}>
                {[0, 1, 2, 3, 4, 6].map(n => (
                  <button key={n} onClick={() => handleBall(n)} style={styles.runBtn}>{n}</button>
                ))}
                <button onClick={() => handleBall(0, "WD")} style={styles.extraBtn}>WD</button>
                <button onClick={() => handleBall(0, "NB")} style={styles.extraBtn}>NB</button>
                <button onClick={() => handleBall(0, "W")} style={styles.wktBtn}>WKT</button>
              </div>
              <button onClick={() => { if(window.confirm("End Match?")) { remove(ref(db, 'liveMatch')); setView('live'); } }} style={styles.delBtn}>End & Delete Match</button>
            </div>
          )}
        </div>
      )}

      {/* No Match State */}
      {view === 'live' && !match && (
        <div style={styles.noMatch}>
          <p>Koi Match Live Nahi Hai</p>
        </div>
      )}
    </div>
  );
}

// CSS Styles
const styles = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: 'white', padding: '15px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161e2d', padding: '12px', borderRadius: '12px', marginBottom: '20px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userName: { fontSize: '14px', fontWeight: 'bold' },
  onlineText: { fontSize: '10px', color: '#22c55e' },
  setupBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold' },
  pinInput: { background: 'transparent', border: '1px solid #334155', color: 'white', padding: '8px', borderRadius: '8px', width: '100px', textAlign: 'center' },
  card: { background: '#161e2d', padding: '20px', borderRadius: '15px', border: '1px solid #1e293b' },
  input: { width: '100%', padding: '15px', marginBottom: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', boxSizing: 'border-box' },
  area: { width: '100%', padding: '15px', marginBottom: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', minHeight: '80px', boxSizing: 'border-box' },
  startBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' },
  boardCard: { background: 'linear-gradient(180deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '15px', textAlign: 'center', marginBottom: '15px' },
  teams: { fontSize: '18px', fontWeight: '600', color: '#94a3b8' },
  mainScore: { fontSize: '65px', fontWeight: 'bold', color: '#facc15', margin: '10px 0' },
  oversText: { fontSize: '20px', color: 'white' },
  freeHitText: { color: '#ef4444', fontWeight: 'bold', marginTop: '10px', animation: 'pulse 1s infinite' },
  waBtn: { background: '#25D366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', marginTop: '15px', width: '100%' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' },
  statBox: { background: '#161e2d', padding: '15px', borderRadius: '10px', textAlign: 'center' },
  statLabel: { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '14px', fontWeight: 'bold', margin: '5px 0' },
  statRuns: { fontSize: '18px', fontWeight: '900', color: '#facc15' },
  controlsBlock: { background: '#161e2d', padding: '15px', borderRadius: '15px' },
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  runBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' },
  extraBtn: { padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' },
  wktBtn: { padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' },
  delBtn: { width: '100%', padding: '15px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', marginTop: '15px', fontWeight: 'bold' },
  center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#facc15', fontSize: '18px' },
  noMatch: { textAlign: 'center', marginTop: '100px', color: '#94a3b8', fontSize: '18px' }
};
