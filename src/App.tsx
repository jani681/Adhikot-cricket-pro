import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaUndo, FaSave, FaUserCircle } from 'react-icons/fa';

// Sahi Firebase Config yahan paste karen
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV3() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mRef = ref(db, 'liveMatch');
    return onValue(mRef, (snapshot) => {
      setMatch(snapshot.val());
      setLoading(false);
    });
  }, []);

  const startNewMatch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const setup = {
      lg: fd.get('lg'), gr: fd.get('gr'),
      t1: fd.get('t1'), t2: fd.get('t2'),
      overs: fd.get('overs'), score: 0, wkts: 0, ov: 0, bl: 0,
      status: "LIVE"
    };
    set(ref(db, 'liveMatch'), setup);
  };

  if (loading) return <div style={s.center}>Loading Adhikot Pro...</div>;

  // Login Screen
  if (!isAdmin && !match) {
    return (
      <div style={s.authPage}>
        <h2 style={{color:'#facc15'}}>Adhikot Pro Admin</h2>
        <input 
          type="password" 
          placeholder="Enter PIN (6545)" 
          onChange={(e) => e.target.value === "6545" && setIsAdmin(true)}
          style={s.pInput}
        />
        <p style={{opacity:0.5}}>No Live Match</p>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.profile}><FaUserCircle size={30} color="#facc15"/> Touqeer Iqbal</div>
        {isAdmin && <button onClick={() => setIsAdmin(false)} style={s.lock}>Lock</button>}
      </div>

      {isAdmin && !match ? (
        <form onSubmit={startNewMatch} style={s.form}>
          <h3 style={{color:'#facc15'}}>Setup New Match</h3>
          <input name="lg" placeholder="League Name" style={s.pInput} required />
          <input name="gr" placeholder="Ground Name" style={s.pInput} required />
          <input name="t1" placeholder="Batting Team" style={s.pInput} required />
          <input name="t2" placeholder="Bowling Team" style={s.pInput} required />
          <input name="overs" placeholder="Total Overs" type="number" style={s.pInput} required />
          <button type="submit" style={s.goldBtn}>START LIVE MATCH</button>
        </form>
      ) : (
        match && (
          <div style={s.dashboard}>
            <div style={s.cbBox}>
              <div style={{fontSize:'12px'}}>{match.lg} | {match.gr}</div>
              <div style={s.score}>{match.score}/{match.wkts} <small>({match.ov}.{match.bl})</small></div>
              <div style={{color:'#94a3b8'}}>{match.t1} vs {match.t2}</div>
            </div>
            {isAdmin && <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.endBtn}>Finish Match</button>}
          </div>
        )
      )}
    </div>
  );
}

const s = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: 'white', padding: '15px' },
  center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#facc15' },
  authPage: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #1e293b' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' },
  pInput: { padding: '12px', width: '80%', background: '#111827', border: '1px solid #334155', color: 'white', borderRadius: '8px', marginBottom: '10px' },
  form: { marginTop: '20px', padding: '15px', background: '#111827', borderRadius: '12px' },
  goldBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  dashboard: { marginTop: '20px' },
  cbBox: { background: 'linear-gradient(180deg, #1e293b, #0a0e1a)', padding: '25px', borderRadius: '15px', textAlign: 'center', border: '1px solid #334155' },
  score: { fontSize: '50px', fontWeight: 'bold', color: '#facc15' },
  endBtn: { marginTop: '20px', width: '100%', padding: '10px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white' },
  lock: { background: '#334155', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px' }
};
