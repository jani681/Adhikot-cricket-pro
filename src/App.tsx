import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

// Firebase Config - Isay change na karein agar working hai
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotPro() {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [view, setView] = useState('live');
  const [animation, setAnimation] = useState(null);

  // Setup State
  const [setup, setSetup] = useState({
    t1: "", t2: "", umpire: "", overs: 10, target: 0,
    t1_players: "", t2_players: ""
  });

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snapshot) => {
      setMatch(snapshot.val());
      setLoading(false);
    });
  }, []);

  // WhatsApp Message Logic
  const sendWhatsAppUpdate = (phone) => {
    if (!match) return;
    const msg = `🏏 Adhikot Pro Live:\n${match.t1} vs ${match.t2}\nScore: ${match.score}/${match.wkts}\nOvers: ${match.ov}.${match.bl}\nCRR: ${calculateRR()}\nUmpire: ${match.umpire}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const calculateRR = () => {
    if (!match || (match.ov === 0 && match.bl === 0)) return "0.00";
    const totalBalls = (match.ov * 6) + match.bl;
    return ((match.score / totalBalls) * 6).toFixed(2);
  };

  // Ball Handling Logic
  const handleBall = (runs, type = "N") => {
    if (!isAuthorized || !match) return;
    let m = { ...match };

    if (runs === 4) setAnimation("✨ FOUR! ✨");
    if (runs === 6) setAnimation("🚀 SIXER! 🚀");
    if (type === "W") setAnimation("☝️ OUT! ☝️");

    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
      if (type === "NB") m.isFreeHit = true;
    } else if (type === "W") {
      m.wkts += 1;
      m.bl += 1;
      m.isFreeHit = false;
    } else {
      m.score += runs;
      m.bl += 1;
      m.isFreeHit = false;
      // Strike Rotation
      if (runs % 2 !== 0) {
        let temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    if (m.bl === 6) { m.ov += 1; m.bl = 0; }
    set(ref(db, 'liveMatch'), m);
    setTimeout(() => setAnimation(null), 2000);
  };

  if (loading) return <div style={styles.loading}>Loading Adhikot Pro...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.user}>
          <div style={styles.avatar}>T</div>
          <div>
            <div style={styles.userName}>Touqeer Iqbal Baghoor</div>
            <div style={styles.sub}>Umpire System Integrated</div>
          </div>
        </div>
        <button onClick={() => setView('setup')} style={styles.addBtn}>+ Match</button>
      </div>

      {/* Admin Auth */}
      {!isAuthorized && (
        <div style={styles.authRow}>
          <input 
            type="password" 
            placeholder="Admin Password" 
            onChange={(e) => e.target.value === "6545" && setIsAuthorized(true)} 
            style={styles.passInput} 
          />
        </div>
      )}

      {/* Animation Layer */}
      {animation && <div style={styles.animBox}>{animation}</div>}

      {/* Live Match Screen */}
      {view === 'live' && match && (
        <div style={styles.card}>
          <div style={styles.meta}>Target: {match.target || 'N/A'} | Umpire: {match.umpire}</div>
          <div style={styles.score}>{match.score}/{match.wkts} <span style={styles.ovText}>({match.ov}.{match.bl})</span></div>
          <div style={styles.rr}>CRR: {calculateRR()}</div>
          
          {match.isFreeHit && <div style={styles.freeHit}>⚡ FREE HIT</div>}

          {/* Player Stats */}
          <div style={styles.statsTable}>
            <div style={styles.row}>
              <span>🏏 {match.striker}*</span>
              <button onClick={() => sendWhatsAppUpdate("9230000000")} style={styles.wa}>WA</button>
            </div>
            <div style={styles.row}>
              <span>🏏 {match.nonStriker}</span>
            </div>
          </div>

          {/* Admin Buttons */}
          {isAuthorized && (
            <div style={styles.grid}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleBall(n)} style={styles.btn}>{n}</button>)}
              <button onClick={() => handleBall(0, "WD")} style={styles.extra}>WD</button>
              <button onClick={() => handleBall(0, "NB")} style={styles.extra}>NB</button>
              <button onClick={() => handleBall(0, "W")} style={styles.wkt}>WKT</button>
            </div>
          )}
        </div>
      )}

      {/* Setup View */}
      {view === 'setup' && isAuthorized && (
        <div style={styles.form}>
          <input placeholder="Team 1" onChange={e => setSetup({...setup, t1: e.target.value})} style={styles.input}/>
          <input placeholder="Team 2" onChange={e => setSetup({...setup, t2: e.target.value})} style={styles.input}/>
          <input placeholder="Umpire Name" onChange={e => setSetup({...setup, umpire: e.target.value})} style={styles.input}/>
          <input placeholder="Target" type="number" onChange={e => setSetup({...setup, target: e.target.value})} style={styles.input}/>
          <button onClick={() => {
            set(ref(db, 'liveMatch'), {
              ...setup, score: 0, wkts: 0, ov: 0, bl: 0, 
              striker: "Batsman 1", nonStriker: "Batsman 2", isFreeHit: false
            });
            setView('live');
          }} style={styles.startBtn}>START MATCH</button>
        </div>
      )}

      {!match && view === 'live' && <div style={styles.empty}>Koi Match Live Nahi Hai.</div>}
    </div>
  );
}

const styles = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: 'white', padding: '15px', fontFamily: 'Arial' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userName: { fontSize: '14px', fontWeight: 'bold' },
  sub: { fontSize: '10px', color: '#22c55e' },
  card: { background: '#161e2d', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #2d3748' },
  score: { fontSize: '48px', fontWeight: 'bold', color: '#facc15' },
  ovText: { fontSize: '18px', color: '#94a3b8' },
  animBox: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: 'black', padding: '20px', borderRadius: '10px', fontSize: '24px', fontWeight: 'bold', zIndex: 100 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' },
  btn: { padding: '15px', borderRadius: '8px', border: 'none', background: 'white', color: 'black', fontWeight: 'bold' },
  extra: { padding: '15px', borderRadius: '8px', border: 'none', background: '#facc15', color: 'black', fontWeight: 'bold' },
  wkt: { padding: '15px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold' },
  wa: { background: '#25d366', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px' },
  passInput: { background: '#161e2d', border: '1px solid #facc15', color: 'white', padding: '5px', borderRadius: '5px', width: '120px' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: 'white' }
};
