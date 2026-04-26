import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotOriginal1122() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('live'); 
  const adminNumber = "00923015800630";

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snapshot) => {
      setMatch(snapshot.val());
    });
  }, []);

  const handleCreateMatch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const setup = {
      league: fd.get('league'),
      overs: fd.get('overs'),
      t1: fd.get('t1'),
      t2: fd.get('t2'),
      umpire: fd.get('umpire'),
      score: 0, wkts: 0, ov: 0, bl: 0,
      striker: "Batsman 1", nonStriker: "Batsman 2",
      bowler: "Bowler 1",
      status: "1st Innings"
    };
    set(ref(db, 'liveMatch'), setup);
    setView('live');
  };

  const updateScore = (runs, type = "N") => {
    if (!isAdmin || !match) return;
    let m = { ...match };
    if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
    } else if (type === "W") {
      m.wkts += 1; m.bl += 1;
    } else {
      m.score += runs; m.bl += 1;
    }
    if (m.bl === 6) { m.ov += 1; m.bl = 0; }
    set(ref(db, 'liveMatch'), m);
  };

  return (
    <div style={s.container}>
      {/* Permanent Admin Branding */}
      <div style={s.header}>
        <div style={s.adminInfo}>
          <div style={s.avatar}>T</div>
          <div>
            <div style={s.adminName}>Touqeer Iqbal Baghoor</div>
            <div style={s.waLive}>WhatsApp: {adminNumber}</div>
          </div>
        </div>
        {!match && <button onClick={() => setView('setup')} style={s.plusBtn}>+ Match</button>}
      </div>

      {/* Login Field for 1122 */}
      {!isAdmin && (
        <div style={s.loginBar}>
          <input 
            type="password" 
            placeholder="PIN" 
            onChange={(e) => e.target.value === "1122" && setIsAdmin(true)} 
            style={s.pinInput} 
          />
        </div>
      )}

      {/* Setup View */}
      {view === 'setup' && isAdmin && !match && (
        <form onSubmit={handleCreateMatch} style={s.card}>
          <h3 style={{color:'#facc15'}}>New Match Setup</h3>
          <input name="league" placeholder="League Name" style={s.input} />
          <input name="overs" placeholder="Total Overs" type="number" style={s.input} />
          <input name="t1" placeholder="Batting Team" style={s.input} />
          <input name="t2" placeholder="Bowling Team" style={s.input} />
          <input name="umpire" placeholder="Umpire Name" style={s.input} />
          <button type="submit" style={s.startBtn}>START LIVE</button>
        </form>
      )}

      {/* Live Dashboard */}
      {match && (
        <div style={s.liveArea}>
          <div style={s.scoreCard}>
            <div style={s.leagueName}>{match.league}</div>
            <div style={s.teams}>{match.t1} vs {match.t2}</div>
            <div style={s.bigScore}>{match.score}/{match.wkts}</div>
            <div style={s.overs}>Overs: {match.ov}.{match.bl} / {match.overs}</div>
            <div style={s.umpire}>Umpire: {match.umpire}</div>
          </div>

          {isAdmin && (
            <div style={s.controls}>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => updateScore(n)} style={s.btn}>{n}</button>)}
                <button onClick={() => updateScore(0, "WD")} style={s.extra}>WD</button>
                <button onClick={() => updateScore(0, "NB")} style={s.extra}>NB</button>
                <button onClick={() => updateScore(0, "W")} style={s.wkt}>WKT</button>
              </div>
              <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}>Finish Match</button>
            </div>
          )}
        </div>
      )}

      {!match && view === 'live' && <div style={s.empty}>Wait for Match to Start...</div>}
    </div>
  );
}

const s = {
  container: { background: '#050a18', minHeight: '100vh', padding: '15px', color: 'white', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '10px', borderRadius: '12px', borderBottom: '2px solid #facc15' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', color: 'black', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  adminName: { fontSize: '14px', fontWeight: 'bold' },
  waLive: { fontSize: '10px', color: '#22c55e' },
  loginBar: { textAlign: 'right', marginTop: '10px' },
  pinInput: { background: 'transparent', border: '1px solid #374151', color: 'white', width: '50px', textAlign: 'center', borderRadius: '5px' },
  card: { background: '#111827', padding: '20px', borderRadius: '15px', marginTop: '20px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#1f2937', border: 'none', color: 'white', borderRadius: '8px' },
  startBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  scoreCard: { background: 'linear-gradient(to bottom, #1e293b, #0f172a)', padding: '30px', borderRadius: '20px', textAlign: 'center', marginTop: '20px' },
  bigScore: { fontSize: '60px', fontWeight: 'bold', color: '#facc15' },
  controls: { marginTop: '20px', background: '#111827', padding: '15px', borderRadius: '15px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  btn: { padding: '15px', background: 'white', color: 'black', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  extra: { padding: '15px', background: '#facc15', color: 'black', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  wkt: { padding: '15px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  delBtn: { width: '100%', padding: '10px', marginTop: '15px', background: '#374151', color: 'white', border: 'none', borderRadius: '8px' },
  plusBtn: { background: '#facc15', color: 'black', border: 'none', padding: '5px 15px', borderRadius: '8px', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: '100px', opacity: 0.5 }
};
