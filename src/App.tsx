import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaUndo, FaSave, FaUserCircle } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV3Final() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mRef = ref(db, 'liveMatch');
    return onValue(mRef, (snapshot) => {
      setMatch(snapshot.val());
      setLoading(false);
    });
  }, []);

  const handleScore = (runs, type = 'normal') => {
    if (!match) return;
    let { score, wkts, bl, ov, strike } = { ...match };
    
    if (type === 'normal') {
      score += runs;
      bl += 1;
      // Strike Rotation logic
      if (runs === 1 || runs === 3) strike = strike === 1 ? 2 : 1;
    } else if (type === 'wd' || type === 'nb') {
      score += 1;
    } else if (type === 'wkt') {
      wkts += 1;
      bl += 1;
    }

    if (bl === 6) { 
      ov += 1; bl = 0; 
      strike = strike === 1 ? 2 : 1; // Over khatam honay par strike change
    }
    
    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, strike });
  };

  const sendWhatsApp = () => {
    const text = `🏏 *Adhikot Live Update*\n🏆 ${match.lg}\n📊 Score: ${match.score}/${match.wkts}\n🎾 Overs: ${match.ov}.${match.bl}\n🚩 ${match.t1} vs ${match.t2}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div style={s.center}>Loading Adhikot Pro...</div>;

  // 1. Password Hidden (type="password")
  if (!isAdmin && !match) {
    return (
      <div style={s.authPage}>
        <div style={s.logoCard}>
          <FaUserCircle size={60} color="#facc15" />
          <h2 style={{margin:'15px 0'}}>Adhikot Admin</h2>
          <input 
            type="password" 
            placeholder="Enter Admin PIN" 
            style={s.pInput}
            onChange={(e) => e.target.value === "6545" && setIsAdmin(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.profile}><FaUserCircle color="#facc15"/> Touqeer Iqbal</span>
        <button onClick={sendWhatsApp} style={s.waCircle}><FaWhatsapp /></button>
      </div>

      {!match ? (
        <div style={s.setupCard}>
          <h3>New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), t1: fd.get('t1'), t2: fd.get('t2'),
              overs: fd.get('overs'), score: 0, wkts: 0, ov: 0, bl: 0, strike: 1, status: "LIVE"
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.mInput} required />
            <input name="t1" placeholder="Team A (Batting)" style={s.mInput} required />
            <input name="t2" placeholder="Team B (Bowling)" style={s.mInput} required />
            <input name="overs" placeholder="Total Overs" type="number" style={s.mInput} required />
            <button type="submit" style={s.goldBtn}>START MATCH</button>
          </form>
        </div>
      ) : (
        <div style={s.dashboard}>
          <div style={s.scoreCard}>
            <p style={s.lgName}>{match.lg}</p>
            <h1 style={s.mainScore}>{match.score}/{match.wkts}</h1>
            <p style={s.ovText}>Overs: {match.ov}.{match.bl} / {match.overs}</p>
            <div style={s.teamsLine}>{match.t1} vs {match.t2}</div>
          </div>

          {isAdmin && (
            <div style={s.controls}>
              <div style={s.grid}>
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} onClick={() => handleScore(r)} style={s.runBtn}>{r}</button>
                ))}
                <button onClick={() => handleScore(0, 'wd')} style={s.extraBtn}>WD</button>
                <button onClick={() => handleScore(0, 'nb')} style={s.extraBtn}>NB</button>
                <button onClick={() => handleScore(0, 'wkt')} style={s.wktBtn}>WKT</button>
              </div>
              <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.endBtn}>Finish & Clear Match</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#facc15' },
  authPage: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050810' },
  logoCard: { textAlign: 'center', background: '#111827', padding: '40px', borderRadius: '20px', border: '1px solid #1e293b', width: '80%' },
  pInput: { padding: '12px', background: '#0a0e1a', border: '1px solid #facc15', color: 'white', borderRadius: '8px', textAlign: 'center', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#111827' },
  waCircle: { background: '#25d366', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  setupCard: { padding: '20px', margin: '20px', background: '#111827', borderRadius: '15px' },
  mInput: { width: '100%', padding: '12px', marginBottom: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', boxSizing: 'border-box' },
  goldBtn: { width: '100%', padding: '15px', background: '#facc15', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  scoreCard: { margin: '20px', padding: '30px', background: 'linear-gradient(180deg, #1e293b, #0a0e1a)', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155' },
  mainScore: { fontSize: '64px', margin: '10px 0', color: '#facc15' },
  controls: { padding: '0 20px 20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  runBtn: { padding: '20px', background: 'white', color: 'black', border: 'none', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold' },
  extraBtn: { padding: '20px', background: '#facc15', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  wktBtn: { padding: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  endBtn: { width: '100%', marginTop: '20px', padding: '12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px' }
};
