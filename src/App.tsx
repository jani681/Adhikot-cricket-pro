import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaCog, FaTrash, FaSave, FaUsers, FaLock, FaUnlock } from 'react-icons/fa';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProFinalFix() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [tempPin, setTempPin] = useState("");

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => {
      if (snap.exists()) setMatch(snap.val());
    });
  }, []);

  const handleAdminLogin = () => {
    if (tempPin === "6545") { // Aapka secret PIN
      setIsAdmin(true);
      setShowPinModal(false);
      alert("Admin Access Granted!");
    } else {
      alert("Wrong PIN!");
    }
  };

  // Fixed Score Function
  const updateScore = (runs, type = 'normal') => {
    if (!isAdmin) return alert("Please Login as Admin first!");
    if (!match) return;

    let data = { ...match };
    // Over counting fix (0.1 to 0.5 then 1.0)
    data.bl = (data.bl || 0) + 1;
    if (data.bl > 5) {
      data.ov = (data.ov || 0) + 1;
      data.bl = 0;
    }
    
    data.score = (data.score || 0) + runs;
    update(ref(db, 'liveMatch'), data);
  };

  return (
    <div style={s.container}>
      {/* Header with Settings Icon */}
      <div style={s.header}>
        <div style={s.flexBetween}>
          <div style={s.profile}>
            <div style={s.avatar}>T</div>
            <div>
              <div style={s.name}>Touqeer Iqbal</div>
              <div style={{color: isAdmin ? '#22c55e' : '#ef4444', fontSize:'12px'}}>
                ● {isAdmin ? 'ADMIN ACTIVE' : 'VIEWER MODE'}
              </div>
            </div>
          </div>
          <div style={s.flex}>
            <FaWhatsapp size={22} color="#22c55e" onClick={() => window.open(`https://wa.me/923015800630`)} />
            <FaCog size={22} style={s.cog} onClick={() => setShowPinModal(true)} />
          </div>
        </div>
      </div>

      {match ? (
        <div style={s.content}>
          <div style={s.scoreCard}>
            <div style={s.teams}>{match.t1} vs {match.t2}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts || 0}</div>
            <div style={s.overs}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
          </div>

          {/* Score Buttons - Ab clickable honge agar isAdmin true hai */}
          <div style={s.buttonGrid}>
            {[0, 1, 2, 3, 4, 6].map(num => (
              <button 
                key={num} 
                onClick={() => updateScore(num)} 
                style={{...s.btn, opacity: isAdmin ? 1 : 0.5}}
                disabled={!isAdmin}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Admin Exclusive Buttons */}
          {isAdmin && (
            <div style={s.adminActions}>
              <button style={s.saveBtn} onClick={() => alert("Match Saved!")}><FaSave/> SAVE</button>
              <button style={s.delBtn} onClick={() => remove(ref(db, 'liveMatch'))}><FaTrash/> DELETE</button>
            </div>
          )}
        </div>
      ) : (
        <div style={s.noMatch}>No Live Match. Click Settings to Start.</div>
      )}

      {/* Pin Modal */}
      {showPinModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3>Admin Access</h3>
            <input 
              type="password" 
              placeholder="Enter PIN" 
              style={s.input} 
              onChange={(e) => setTempPin(e.target.value)}
            />
            <button onClick={handleAdminLogin} style={s.goldBtn}>UNLOCK</button>
            <button onClick={() => setShowPinModal(false)} style={s.closeBtn}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#0f172a', padding: '15px', borderBottom: '1px solid #1e293b' },
  flexBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  flex: { display: 'flex', alignItems: 'center', gap: '15px' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '35px', height: '35px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  name: { fontWeight: 'bold', fontSize: '14px' },
  cog: { cursor: 'pointer', opacity: 0.8 },
  content: { padding: '15px' },
  scoreCard: { background: '#0f172a', borderRadius: '20px', padding: '30px', textAlign: 'center', border: '1px solid #1e293b' },
  mainScore: { fontSize: '60px', fontWeight: 'bold', color: '#facc15', margin: '10px 0' },
  teams: { opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' },
  buttonGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' },
  btn: { padding: '20px', background: 'white', color: 'black', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
  adminActions: { display: 'flex', gap: '10px', marginTop: '15px' },
  saveBtn: { flex: 1, background: '#22c55e', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  delBtn: { flex: 1, background: '#ef4444', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '80%', textAlign: 'center' },
  input: { width: '100%', padding: '12px', margin: '15px 0', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', textAlign: 'center' },
  goldBtn: { width: '100%', padding: '12px', background: '#facc15', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px' },
  closeBtn: { width: '100%', background: 'transparent', color: '#94a3b8', border: 'none' }
};
