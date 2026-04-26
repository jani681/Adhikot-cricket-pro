import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaUndo, FaSave, FaUserCircle, FaClock, FaMapMarkerAlt, FaStar } from 'react-icons/fa';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProUltimate() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [anim, setAnim] = useState("");
  const [showTeam, setShowTeam] = useState(null); // 't1' or 't2'

  useEffect(() => {
    const mRef = ref(db, 'liveMatch');
    return onValue(mRef, (snapshot) => setMatch(snapshot.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 2500); };

  const handleScore = (runs, type = 'normal') => {
    if (!match) return;
    let { score, wkts, bl, ov, freeHit, striker, sRuns, sBalls } = { ...match };
    
    if (type === 'normal') {
      score += runs; bl += 1; sRuns += runs; sBalls += 1;
      if (runs === 4) triggerAnim("FOUR! 🏏");
      if (runs === 6) triggerAnim("SIXER! 🚀");
      freeHit = false;
    } else if (type === 'wd') {
      score += 1; triggerAnim("WIDE ↔️");
    } else if (type === 'nb') {
      score += 1; freeHit = true; triggerAnim("FREE HIT! ⚡");
    } else if (type === 'wkt') {
      if (!freeHit) { wkts += 1; triggerAnim("OUT! ☝️"); }
      else { score += runs; triggerAnim("RUN OUT! 🏃"); }
      bl += 1; sBalls += 1;
    }

    if (bl === 6) { ov += 1; bl = 0; }
    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, freeHit, sRuns, sBalls });
  };

  const sendDirectUpdate = (pName, pNum) => {
    const text = `Salaam ${pName}! Match Update:\nScore: ${match.score}/${match.wkts}\nOvers: ${match.ov}.${match.bl}`;
    window.open(`https://wa.me/${pNum}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.authPage}>
        <FaUserCircle size={80} color="#facc15" />
        <h2 style={{color:'white'}}>Adhikot Pro Admin</h2>
        <input type="password" placeholder="Enter PIN (6545)" style={s.pInput} 
          onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Permanent Admin Header */}
      <div style={s.adminHeader}>
         <div style={s.flex}>
            <div style={s.avatar}>T</div>
            <div>
               <div style={{fontWeight:'bold'}}>Touqeer Iqbal Baghoor</div>
               <div style={{fontSize:'10px', color:'#25d366'}}>● WhatsApp Admin Active</div>
            </div>
         </div>
         <a href="https://wa.me/923015800630" style={s.waCircle}><FaWhatsapp /></a>
      </div>

      {anim && <div style={s.bigAnim}>{anim}</div>}

      {!match ? (
        <div style={s.card}>
          <h3>Setup Intelligent Match</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), t1: fd.get('t1'), t2: fd.get('t2'),
              ump: fd.get('ump'), overs: fd.get('overs'), 
              score: 0, wkts: 0, ov: 0, bl: 0, 
              striker: "Batsman 1", sRuns: 0, sBalls: 0,
              bowler: "Bowler 1", bOvs: 0, bRuns: 0, bWkts: 0,
              t1_players: fd.get('t1p').split(','), t2_players: fd.get('t2p').split(','),
              target: fd.get('target') || 0
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.mInput} required />
            <input name="gr" placeholder="Ground" style={s.mInput} required />
            <input name="t1" placeholder="Team A Name" style={s.mInput} required />
            <textarea name="t1p" placeholder="Team A Players (Name-Number, Name-Number)" style={s.mInput} />
            <input name="t2" placeholder="Team B Name" style={s.mInput} required />
            <textarea name="t2p" placeholder="Team B Players (Name-Number, Name-Number)" style={s.mInput} />
            <input name="ump" placeholder="Umpire" style={s.mInput} />
            <input name="overs" placeholder="Overs" type="number" style={s.mInput} />
            <button type="submit" style={s.goldBtn}>START SYSTEM</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          {/* Scoreboard */}
          <div style={s.mainScoreBoard}>
            <div style={s.meta}><FaMapMarkerAlt/> {match.gr} | Umpire: {match.ump}</div>
            <h1 style={s.scoreText}>{match.score}/{match.wkts} <small style={{fontSize:'20px'}}>({match.ov}.{match.bl})</small></h1>
            <div style={s.badge}>{match.lg}</div>
            <div style={s.teamsRow}>
               <span onClick={() => setShowTeam('t1')} style={s.clickableTeam}>{match.t1}</span> 
               <span>vs</span> 
               <span onClick={() => setShowTeam('t2')} style={s.clickableTeam}>{match.t2}</span>
            </div>
            {match.target > 0 && <div style={s.targetBox}>Target: {match.target} (Need {match.target - match.score} in {(match.overs*6) - (match.ov*6 + match.bl)} balls)</div>}
          </div>

          {/* Player Selection (Manual) */}
          <div style={s.statsCard}>
             <div style={s.playerLine}>
                <span>🏏 {match.striker}*</span>
                <span>{match.sRuns}({match.sBalls})</span>
             </div>
             <div style={s.playerLine}>
                <span>🏀 {match.bowler}</span>
                <span>{match.bWkts}/{match.bRuns}</span>
             </div>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div style={s.controls}>
               <div style={s.grid}>
                  {[0,1,2,3,4,6].map(r => <button key={r} onClick={() => handleScore(r)} style={s.btn}>{r}</button>)}
                  <button onClick={() => handleScore(0, 'wd')} style={s.exBtn}>WD</button>
                  <button onClick={() => handleScore(0, 'nb')} style={s.exBtn}>NB</button>
                  <button onClick={() => handleScore(0, 'wkt')} style={s.wktBtn}>WKT</button>
               </div>
               <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}>Finish & Save Match</button>
            </div>
          )}

          {/* Team Players Overlay */}
          {showTeam && (
            <div style={s.overlay}>
               <div style={s.modal}>
                  <h4>{showTeam === 't1' ? match.t1 : match.t2} Players</h4>
                  {(showTeam === 't1' ? match.t1_players : match.t2_players).map(p => {
                    const [name, num] = p.split('-');
                    return (
                      <div key={name} style={s.pRow}>
                         <span>{name}</span>
                         <FaWhatsapp color="#25d366" onClick={() => sendDirectUpdate(name, num)} />
                      </div>
                    )
                  })}
                  <button onClick={() => setShowTeam(null)} style={s.goldBtn}>Close</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#05080f', minHeight: '100vh', color: 'white', fontFamily: 'Arial' },
  authPage: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  adminHeader: { background: '#111827', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #facc15' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  waCircle: { background: '#25d366', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  mainScoreBoard: { background: 'linear-gradient(to bottom, #1e293b, #0f172a)', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155', position: 'relative' },
  scoreText: { fontSize: '55px', margin: '10px 0', color: '#facc15' },
  badge: { display: 'inline-block', background: '#334155', padding: '5px 15px', borderRadius: '20px', fontSize: '12px' },
  clickableTeam: { color: '#facc15', textDecoration: 'underline', cursor: 'pointer', margin: '0 10px' },
  bigAnim: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', fontWeight: 'bold', background: '#facc15', color: 'black', padding: '20px 40px', borderRadius: '50px', zIndex: 1000, boxShadow: '0 0 20px #facc15' },
  pInput: { padding: '12px', borderRadius: '8px', border: '1px solid #facc15', background: '#0f172a', color: 'white', textAlign: 'center' },
  mInput: { width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '10px', boxSizing: 'border-box' },
  goldBtn: { width: '100%', padding: '15px', background: '#facc15', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' },
  btn: { padding: '20px', borderRadius: '10px', border: 'none', background: 'white', fontWeight: 'bold', fontSize: '18px' },
  exBtn: { padding: '20px', borderRadius: '10px', border: 'none', background: '#facc15', fontWeight: 'bold' },
  wktBtn: { padding: '20px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: '#111827', padding: '20px', borderRadius: '15px', width: '85%' },
  pRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #334155' },
  targetBox: { marginTop: '10px', color: '#60a5fa', fontSize: '14px' },
  statsCard: { background: '#111827', margin: '15px 0', padding: '15px', borderRadius: '12px' },
  playerLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }
};
