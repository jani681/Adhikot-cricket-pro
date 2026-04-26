import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV5() {
  const [match, setMatch] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [view, setView] = useState('live');
  const [animation, setAnimation] = useState(null);
  const adminNumber = "00923015800630";

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snapshot) => {
      setMatch(snapshot.val());
    });
  }, []);

  // Intelligent Target & Status Logic
  const getMatchStatus = () => {
    if (!match) return "";
    if (match.innings === 1) return `1st Innings: Target Setting...`;
    const runsNeeded = match.target - match.score;
    if (runsNeeded <= 0) return `${match.t2} Won!`;
    return `${match.t2} needs ${runsNeeded} runs to win`;
  };

  const sendWhatsApp = () => {
    if (!match) return;
    const text = `🏏 *Adhikot Pro Live Update*\n\n*${match.t1}* vs *${match.t2}*\n━━━━━━━━━━━━━━\nScore: *${match.score}/${match.wkts}*\nOvers: *${match.ov}.${match.bl}*\nStatus: ${getMatchStatus()}\n━━━━━━━━━━━━━━\nShared by: Touqeer Iqbal Baghoor`;
    window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleBall = (runs, type = "N") => {
    if (!isAuthorized || !match) return;
    let m = { ...match };

    // Animations
    if (runs === 4) triggerAnim("✨ FOUR! ✨");
    if (runs === 6) triggerAnim("🚀 SIXER! 🚀");
    if (type === "W") triggerAnim("☝️ OUT! ☝️");

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

  const triggerAnim = (txt) => {
    setAnimation(txt);
    setTimeout(() => setAnimation(null), 2500);
  };

  const endInnings = () => {
    if (match.innings === 1) {
      const newTarget = match.score + 1;
      set(ref(db, 'liveMatch'), { ...match, target: newTarget, innings: 2, score: 0, wkts: 0, ov: 0, bl: 0 });
      triggerAnim("🎯 Target Set: " + newTarget);
    } else {
      remove(ref(db, 'liveMatch'));
      setView('live');
    }
  };

  return (
    <div style={styles.container}>
      {/* Permanent Header */}
      <div style={styles.header}>
        <div style={styles.userRow}>
          {/* Avatar without URL */}
          <div style={styles.avatar}>T</div> 
          <div>
            <div style={styles.name}>Touqeer Iqbal Baghoor</div>
            <div style={styles.waTag}>WhatsApp Integrated: {adminNumber}</div>
          </div>
        </div>
        <button onClick={() => setView('setup')} style={styles.matchBtn}>+ Match</button>
      </div>

      {animation && <div style={styles.overlay}>{animation}</div>}

      {match ? (
        <div style={styles.card}>
          <div style={styles.inningsTag}>Innings: {match.innings}</div>
          <div style={styles.teams}>{match.t1} vs {match.t2}</div>
          <div style={styles.score}>{match.score}/{match.wkts}</div>
          <div style={styles.ov}>({match.ov}.{match.bl})</div>
          <div style={styles.status}>{getMatchStatus()}</div>

          <button onClick={sendWhatsApp} style={styles.waBtn}>Send WhatsApp Update</button>

          {isAuthorized && (
            <div style={styles.adminGrid}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleBall(n)} style={styles.ballBtn}>{n}</button>)}
              <button onClick={() => handleBall(0, "WD")} style={styles.extra}>WD</button>
              <button onClick={() => handleBall(0, "NB")} style={styles.extra}>NB</button>
              <button onClick={() => handleBall(0, "W")} style={styles.wkt}>WKT</button>
              <button onClick={endInnings} style={styles.endBtn}>{match.innings === 1 ? "End Innings" : "Save & Remove"}</button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.empty}>Koi Match Live Nahi Hai.</div>
      )}

      {!isAuthorized && <input type="password" placeholder="Pass" onChange={e => e.target.value === "6545" && setIsAuthorized(true)} style={styles.passInput}/>}
    </div>
  );
}

const styles = {
  container: { background: '#0a0e1a', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '45px', height: '45px', background: 'linear-gradient(45deg, #facc15, #eab308)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#000' },
  name: { fontSize: '14px', fontWeight: 'bold' },
  waTag: { fontSize: '10px', color: '#22c55e' },
  card: { background: '#161e2d', borderRadius: '20px', padding: '25px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  score: { fontSize: '64px', fontWeight: 'bold', color: '#facc15' },
  status: { color: '#94a3b8', margin: '15px 0', fontSize: '14px', fontStyle: 'italic' },
  waBtn: { background: '#25d366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  overlay: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(250, 204, 21, 0.95)', color: 'black', padding: '30px', borderRadius: '15px', fontSize: '30px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 0 50px #facc15' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' },
  ballBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold' },
  endBtn: { gridColumn: 'span 3', background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', marginTop: '10px' },
  passInput: { position: 'fixed', bottom: '10px', right: '10px', width: '60px', opacity: 0.5, background: 'none', border: '1px solid #333', color: 'white', fontSize: '10px' }
};
