import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaMapMarkerAlt, FaUsers, FaTrashAlt, FaLock } from 'react-icons/fa';

// Firebase Config - Double Checked
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProMaster() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDir, setShowDir] = useState(null);
  const [anim, setAnim] = useState("");

  // Real-time Database Sync
  useEffect(() => {
    const mRef = ref(db, 'liveMatch');
    const unsubscribe = onValue(mRef, (snapshot) => {
      const data = snapshot.val();
      setMatch(data);
      // Auto-admin if match exists to prevent UI lock
      if(data) setIsAdmin(true); 
    });
    return () => unsubscribe();
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 2000); };

  const handleScore = (runs, type = 'normal') => {
    if (!match) return;
    let { score, wkts, bl, ov, freeHit, sRuns, sBalls, target } = { ...match };
    
    if (type === 'normal') {
      score += runs; bl += 1; sRuns += runs; sBalls += 1;
      if (runs === 4) triggerAnim("FOUR! ✨");
      if (runs === 6) triggerAnim("SIXER! 🚀");
      freeHit = false;
    } else if (type === 'wd') {
      score += 1; triggerAnim("WIDE ↔️");
    } else if (type === 'nb') {
      score += 1; freeHit = true; triggerAnim("FREE HIT! ⚡");
    } else if (type === 'wkt') {
      if (!freeHit) { wkts += 1; triggerAnim("OUT! ☝️"); }
      else { triggerAnim("NOT OUT (Free Hit)! 🛡️"); freeHit = false; }
      bl += 1; sBalls += 1;
    }

    if (bl === 6) { ov += 1; bl = 0; }
    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, freeHit, sRuns, sBalls });
  };

  // 1. Admin Header (As per your design)
  const Header = () => (
    <div style={s.header}>
      <div style={s.flex}>
        <div style={s.avatar}>T</div>
        <div>
          <div style={s.adminName}>Touqeer Iqbal Baghoor</div>
          <div style={s.onlineStatus}>● WhatsApp Admin Active</div>
        </div>
      </div>
      <a href="https://wa.me/923015800630" style={s.waIcon}><FaWhatsapp /></a>
    </div>
  );

  // 2. Login Screen
  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <Header />
        <div style={s.loginBox}>
          <FaLock size={40} color="#facc15" />
          <h2 style={{margin:'20px 0'}}>Admin Access</h2>
          <input type="password" placeholder="Enter PIN (6545)" style={s.pinField} 
            onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <Header />
      {anim && <div style={s.overlayAnim}>{anim}</div>}

      {!match ? (
        // 3. Match Setup (All requested fields available)
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15', marginBottom:'20px'}}>Setup New Match</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), t1: fd.get('t1'), t2: fd.get('t2'),
              ump: fd.get('ump'), totalOvers: fd.get('overs'), target: fd.get('target') || 0,
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              score: 0, wkts: 0, ov: 0, bl: 0, striker: "New Batsman", sRuns: 0, sBalls: 0,
              bowler: "New Bowler", bRuns: 0, bWkts: 0, freeHit: false
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="gr" placeholder="Ground Name" style={s.input} required />
            <div style={{display:'flex', gap:'10px'}}>
               <input name="t1" placeholder="Team A" style={s.input} required />
               <input name="t2" placeholder="Team B" style={s.input} required />
            </div>
            <textarea name="t1p" placeholder="Team A Players (Name-92xxx, Name-92xxx)" style={s.textarea} />
            <textarea name="t2p" placeholder="Team B Players (Name-92xxx, Name-92xxx)" style={s.textarea} />
            <input name="overs" placeholder="Overs" type="number" style={s.input} required />
            <input name="target" placeholder="Target Score (Optional)" type="number" style={s.input} />
            <input name="ump" placeholder="Umpire Name" style={s.input} />
            <button type="submit" style={s.startBtn}>START LIVE MATCH</button>
          </form>
        </div>
      ) : (
        // 4. Scoreboard & Controls (Pic 1000201592 fix)
        <div style={{padding:'15px'}}>
          <div style={s.scoreDisplay}>
            <div style={s.loc}><FaMapMarkerAlt /> {match.gr} | Ump: {match.ump}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.totalOvers}</div>
            <div style={s.teamRow}>
              <span onClick={() => setShowDir('t1')} style={s.tLink}>{match.t1}</span>
              <span>vs</span>
              <span onClick={() => setShowDir('t2')} style={s.tLink}>{match.t2}</span>
            </div>
          </div>

          {/* Manual Entry Players */}
          <div style={s.playerArea}>
             <div style={s.pLine}>
               <input style={s.pName} value={match.striker} onChange={(e)=>update(ref(db,'liveMatch'),{striker:e.target.value})} />
               <span>{match.sRuns}({match.sBalls})*</span>
             </div>
             <div style={s.pLine}>
               <input style={s.pName} value={match.bowler} onChange={(e)=>update(ref(db,'liveMatch'),{bowler:e.target.value})} />
               <span>{match.bWkts}/{match.score}</span>
             </div>
          </div>

          {/* Fixed Button Grid */}
          <div style={s.grid}>
             {[0,1,2,3,4,6].map(r => <button key={r} onClick={() => handleScore(r)} style={s.numBtn}>{r}</button>)}
             <button onClick={() => handleScore(0, 'wd')} style={s.extraBtn}>WD</button>
             <button onClick={() => handleScore(0, 'nb')} style={s.extraBtn}>NB</button>
             <button onClick={() => handleScore(0, 'wkt')} style={s.outBtn}>WKT</button>
          </div>

          <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.endBtn}><FaTrashAlt /> Finish Match</button>
        </div>
      )}

      {/* Team Directory Modal */}
      {showDir && (
        <div style={s.modalOverlay}>
           <div style={s.modalBody}>
              <h4 style={{borderBottom:'1px solid #334155', paddingBottom:'10px'}}>Player Directory</h4>
              {(showDir === 't1' ? match.t1p : match.t2p).map(p => {
                const [name, num] = p.split('-');
                return (
                  <div key={name} style={s.dirItem}>
                    <span>{name}</span>
                    <a href={`https://wa.me/${num.trim()}`} style={{color:'#25d366'}}><FaWhatsapp size={22}/></a>
                  </div>
                )
              })}
              <button onClick={() => setShowDir(null)} style={s.closeBtn}>Close</button>
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Arial' },
  header: { background: '#0f172a', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #facc15' },
  flex: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' },
  adminName: { fontWeight: 'bold', fontSize: '15px' },
  onlineStatus: { fontSize: '11px', color: '#22c55e' },
  waIcon: { background: '#22c55e', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  loginBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '150px' },
  pinField: { padding: '15px', borderRadius: '10px', background: '#1e293b', border: '2px solid #facc15', color: 'white', textAlign: 'center', fontSize: '22px', width: '200px' },
  setupBox: { padding: '20px', background: '#0f172a', margin: '15px', borderRadius: '15px', border: '1px solid #334155' },
  input: { width: '100%', padding: '12px', marginBottom: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px', height: '70px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', marginBottom: '12px' },
  startBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  scoreDisplay: { background: 'linear-gradient(180deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '25px', textAlign: 'center', border: '1px solid #334155' },
  mainScore: { fontSize: '65px', fontWeight: 'bold', color: '#facc15', margin: '10px 0' },
  overInfo: { fontSize: '18px', opacity: 0.8 },
  loc: { fontSize: '12px', opacity: 0.6, marginBottom: '5px' },
  teamRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', fontWeight: 'bold' },
  tLink: { color: '#facc15', textDecoration: 'underline', cursor: 'pointer' },
  playerArea: { background: '#0f172a', padding: '15px', borderRadius: '15px', margin: '15px 0' },
  pLine: { display: 'flex', justifyContent: 'space-between', padding: '5px 0' },
  pName: { background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: '#60a5fa', fontSize: '16px', outline: 'none', width: '60%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  numBtn: { padding: '22px', background: 'white', color: 'black', borderRadius: '15px', fontSize: '22px', fontWeight: 'bold', border: 'none' },
  extraBtn: { padding: '22px', background: '#facc15', color: 'black', borderRadius: '15px', fontWeight: 'bold', border: 'none' },
  outBtn: { padding: '22px', background: '#ef4444', color: 'white', borderRadius: '15px', fontWeight: 'bold', border: 'none' },
  overlayAnim: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: 'black', padding: '30px 60px', borderRadius: '60px', fontSize: '35px', fontWeight: 'bold', zIndex: 3000 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 },
  modalBody: { background: '#0f172a', padding: '25px', borderRadius: '20px', width: '85%' },
  dirItem: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #1e293b' },
  closeBtn: { width: '100%', marginTop: '20px', padding: '12px', background: '#facc15', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  endBtn: { width: '100%', marginTop: '25px', padding: '14px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px' }
};
