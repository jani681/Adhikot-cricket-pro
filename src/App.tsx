import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog, FaUsers } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProProfessional() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pin, setPin] = useState(""); // Admin PIN state
  const [squadModal, setSquadModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => {
      const data = snap.val();
      if (data) {
        if (data.innings === 2 && data.score >= data.target) {
          data.status = 'Finished';
        } else if (data.ov >= data.maxOv || data.wkts >= 10) {
          data.status = data.innings === 1 ? 'Innings Break' : 'Finished';
        }
        setMatch(data);
      }
    });
  }, []);

  // Admin Login Logic
  const handleLogin = () => {
    if (pin === "6545") { // Secret PIN
      setIsAdmin(true);
      setShowAuth(false);
    } else {
      alert("Ghalat PIN!");
    }
  };

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status === 'Finished') return;
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;

    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs;
      data.bl += 1;
      striker.r = (parseInt(striker.r) || 0) + runs;
      striker.b += 1;
      if (runs === 4) striker.fours = (striker.fours || 0) + 1;
      if (runs === 6) striker.sixes = (striker.sixes || 0) + 1;
    }

    if (data.bl === 6) {
      data.ov += 1; data.bl = 0;
      data.active = data.active === 1 ? 2 : 1;
    }

    update(ref(db, 'liveMatch'), data);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.flexBetween}>
          <div style={s.flex}>
            <div style={s.avatar}>{match?.lg?.charAt(0) || 'T'}</div>
            <div>
              <b>{match?.lg || 'Adhikot Pro'}</b><br/>
              <small style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN ACTIVE' : 'LIVE'}</small>
            </div>
          </div>
          <div style={s.flex}>
            <FaWhatsapp size={24} color="#22c55e" onClick={() => window.open(`https://wa.me/923015800630`)} />
            {/* Functional Admin Icon */}
            <FaCog size={22} style={{marginLeft:'15px', cursor:'pointer'}} onClick={() => setShowAuth(true)} />
          </div>
        </div>
      </div>

      {match && (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={s.teamNames}>{match.t1} vs {match.t2}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl}</div>
          </div>

          {/* Admin Score Controls */}
          {isAdmin && (
            <div style={s.adminGrid}>
              {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
            </div>
          )}
        </div>
      )}

      {/* Admin Login Modal */}
      {showAuth && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{color:'#facc15'}}>Admin Login</h3>
            <input 
              type="password" 
              placeholder="Enter 4-Digit PIN" 
              style={s.input} 
              onChange={(e) => setPin(e.target.value)} 
            />
            <button onClick={handleLogin} style={s.goldBtn}>Login</button>
            <button onClick={() => setShowAuth(false)} style={{background:'none', border:'none', color:'white', marginTop:'10px'}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:'40px', height:'40px', background:'#facc15', borderRadius:'10px', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  card: { background:'#0f172a', padding:'25px', borderRadius:'24px', textAlign:'center', margin:'12px' },
  teamNames: { fontSize:'14px', opacity:0.6 },
  mainScore: { fontSize:'64px', fontWeight:'bold', color:'white' },
  overInfo: { fontSize:'18px', opacity:0.8 },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', padding:'12px' },
  numBtn: { padding:'18px', background:'white', color:'black', borderRadius:'15px', fontWeight:'bold' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'#1e293b', width:'80%', padding:'25px', borderRadius:'24px', textAlign:'center' },
  input: { width:'100%', padding:'12px', borderRadius:'10px', marginBottom:'15px', textAlign:'center', fontSize:'18px' },
  goldBtn: { width:'100%', padding:'12px', background:'#facc15', color:'black', borderRadius:'10px', fontWeight:'bold' }
};
