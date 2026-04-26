import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaUserCircle, FaMapMarkerAlt, FaUsers, FaTrashAlt, FaPhone } from 'react-icons/fa';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProMasterSystem() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTeamList, setShowTeamList] = useState(null);
  const [anim, setAnim] = useState("");

  useEffect(() => {
    const mRef = ref(db, 'liveMatch');
    return onValue(mRef, (snapshot) => setMatch(snapshot.val()));
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
      else triggerAnim("NOT OUT (Free Hit)! 🛡️");
      bl += 1; sBalls += 1;
    }

    if (bl === 6) { ov += 1; bl = 0; }
    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, freeHit, sRuns, sBalls });
  };

  // UI Components
  const AdminProfile = () => (
    <div style={s.profileHeader}>
      <div style={s.flex}>
        <div style={s.dp}>T</div>
        <div>
          <div style={{fontWeight:'bold', fontSize:'14px'}}>Touqeer Iqbal Baghoor</div>
          <div style={{fontSize:'10px', color:'#25d366'}}>● WhatsApp Admin Active</div>
        </div>
      </div>
      <a href="https://wa.me/923015800630" style={s.waBtn}><FaWhatsapp /></a>
    </div>
  );

  // 1. Password Protection Page
  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <AdminProfile />
        <div style={s.authPage}>
          <h2 style={{color:'#facc15'}}>Adhikot Pro Admin</h2>
          <input type="password" placeholder="Enter PIN (6545)" style={s.pinInput} 
            onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
          <p style={{opacity:0.5, fontSize:'12px'}}>Secure Access Only</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <AdminProfile />
      {anim && <div style={s.popAnim}>{anim}</div>}

      {!match ? (
        // 2. Setup Form
        <div style={s.setupForm}>
          <h3>🚀 Start New Match</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), t1: fd.get('t1'), t2: fd.get('t2'),
              ump: fd.get('ump'), totalOvers: fd.get('overs'), target: fd.get('target') || 0,
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              score: 0, wkts: 0, ov: 0, bl: 0, striker: "Batsman", sRuns: 0, sBalls: 0,
              bowler: "Bowler", bRuns: 0, bWkts: 0, freeHit: false
            });
          }}>
            <input name="lg" placeholder="League (e.g. Adhikot Cup)" style={s.input} required />
            <input name="gr" placeholder="Ground Name" style={s.input} required />
            <div style={s.flexGap}>
               <input name="t1" placeholder="Team A" style={s.input} />
               <input name="t2" placeholder="Team B" style={s.input} />
            </div>
            <textarea name="t1p" placeholder="Team A Players (Name-Number, Name-Number)" style={s.area} />
            <textarea name="t2p" placeholder="Team B Players (Name-Number, Name-Number)" style={s.area} />
            <input name="overs" placeholder="Overs" type="number" style={s.input} />
            <input name="target" placeholder="Target (Optional)" type="number" style={s.input} />
            <input name="ump" placeholder="Umpire Name" style={s.input} />
            <button type="submit" style={s.goldBtn}>CREATE LIVE MATCH</button>
          </form>
        </div>
      ) : (
        // 3. Main Intelligent Dashboard
        <div style={{padding:'10px'}}>
          <div style={s.scoreCard}>
             <div style={s.metaRow}><FaMapMarkerAlt /> {match.gr} | Umpire: {match.ump}</div>
             <div style={s.scoreBig}>{match.score}/{match.wkts}</div>
             <div style={s.overSmall}>Overs: {match.ov}.{match.bl} / {match.totalOvers}</div>
             <div style={s.teamsRow}>
                <span onClick={() => setShowTeamList('t1')} style={s.teamName}>{match.t1}</span>
                <span style={{opacity:0.5}}>VS</span>
                <span onClick={() => setShowTeamList('t2')} style={s.teamName}>{match.t2}</span>
             </div>
             {match.target > 0 && <div style={s.targetInfo}>Target: {match.target} (Need {match.target - match.score} runs)</div>}
          </div>

          {/* Manual Selection & Player Stats */}
          <div style={s.playerCard}>
             <div style={s.pRow}>
                <input style={s.pInput} value={match.striker} onChange={(e)=>update(ref(db,'liveMatch'),{striker:e.target.value})} />
                <span>{match.sRuns}({match.sBalls})</span>
             </div>
             <div style={s.pRow}>
                <input style={s.pInput} value={match.bowler} onChange={(e)=>update(ref(db,'liveMatch'),{bowler:e.target.value})} />
                <span>{match.bWkts}/{match.bRuns}</span>
             </div>
          </div>

          {/* Fully Functional Buttons */}
          <div style={s.btnGrid}>
             {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleScore(r)} style={s.scoreBtn}>{r}</button>)}
             <button onClick={() => handleScore(0, 'wd')} style={s.exBtn}>WD</button>
             <button onClick={() => handleScore(0, 'nb')} style={s.exBtn}>NB</button>
             <button onClick={() => handleScore(0, 'wkt')} style={s.wktBtn}>WKT</button>
          </div>

          <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.finishBtn}><FaTrashAlt /> Finish Match</button>
        </div>
      )}

      {/* Team Players Directory Overlay */}
      {showTeamList && (
        <div style={s.overlay}>
           <div style={s.modal}>
              <h4>{showTeamList === 't1' ? match.t1 : match.t2} Directory</h4>
              {(showTeamList === 't1' ? match.t1p : match.t2p).map(p => {
                const [name, num] = p.split('-');
                return (
                  <div key={name} style={s.dirRow}>
                     <span>{name}</span>
                     <a href={`https://wa.me/${num}`} style={{color:'#25d366'}}><FaWhatsapp size={20}/></a>
                  </div>
                )
              })}
              <button onClick={() => setShowTeamList(null)} style={s.goldBtn}>Close</button>
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#05070a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  profileHeader: { background: '#0f172a', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #facc15' },
  flex: { display: 'flex', alignItems: 'center', gap: '10px' },
  dp: { width: '35px', height: '35px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  waBtn: { background: '#25d366', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  authPage: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px' },
  pinInput: { padding: '15px', borderRadius: '10px', background: '#111827', border: '1px solid #facc15', color: 'white', textAlign: 'center', fontSize: '20px' },
  setupForm: { padding: '20px', background: '#0f172a', margin: '15px', borderRadius: '15px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', boxSizing:'border-box' },
  area: { width: '100%', padding: '12px', height: '60px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', marginBottom: '10px' },
  goldBtn: { width: '100%', padding: '15px', background: '#facc15', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  scoreCard: { background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid #334155' },
  scoreBig: { fontSize: '60px', fontWeight: 'bold', color: '#facc15', margin: '5px 0' },
  teamName: { color: '#facc15', textDecoration: 'underline', cursor: 'pointer' },
  teamsRow: { display: 'flex', justifyContent: 'center', gap: '20px', fontWeight: 'bold', marginTop: '10px' },
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' },
  scoreBtn: { padding: '20px', background: 'white', color: 'black', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', border: 'none' },
  exBtn: { padding: '20px', background: '#facc15', color: 'black', borderRadius: '12px', fontWeight: 'bold', border: 'none' },
  wktBtn: { padding: '20px', background: '#ef4444', color: 'white', borderRadius: '12px', fontWeight: 'bold', border: 'none' },
  playerCard: { background: '#111827', padding: '15px', borderRadius: '15px', margin: '15px 0' },
  pRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0' },
  pInput: { background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '16px', borderBottom: '1px solid #334155' },
  popAnim: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: 'black', padding: '30px 60px', borderRadius: '50px', fontSize: '32px', fontWeight: 'bold', zIndex: 1000 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: '#0f172a', padding: '25px', borderRadius: '20px', width: '85%' },
  dirRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #334155' },
  finishBtn: { width: '100%', marginTop: '20px', padding: '12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px' }
};
