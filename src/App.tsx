import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaLock, FaCalendarAlt, FaClock, FaCircle } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProFinal() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [showTeam, setShowTeam] = useState(null); 
  const [anim, setAnim] = useState("");

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  // WhatsApp Status Sharing Function
  const shareToWhatsApp = (playerPhone) => {
    if(!match) return;
    const text = `🔥 LIVE MATCH STATUS 🔥%0A🏆 ${match.lg}%0A🏏 ${match.t1} vs ${match.t2}%0A📊 Score: ${match.score}/${match.wkts} (${match.ov}.${match.bl} Ov)%0A🎯 Target: ${match.target || 'TBD'}%0A📍 Ground: ${match.gr}%0A📱 Watch Live on Adhikot Pro!`;
    window.open(`https://wa.me/${playerPhone}?text=${text}`, '_blank');
  };

  const handleScore = (runs, type = 'normal') => {
    if (!match || match.matchStatus === 'Finished') return;
    
    let { score, wkts, bl, ov, maxOv, target, innings } = { ...match };

    // Win/Loss & Innings Logic
    if (type === 'wkt') {
        wkts += 1;
        triggerAnim("OUT! ☝️");
    } else if (type === 'normal') {
        score += runs;
        bl += 1;
        if (runs === 6) triggerAnim("SIXER! 🚀");
    } else if (type === 'wd' || type === 'nb') {
        score += 1;
    }

    if (bl === 6) { ov += 1; bl = 0; triggerAnim("OVER END! 🔄"); }

    // End of Innings / Match Logic
    let status = 'Live';
    let result = '';
    
    if (innings === 1 && (ov >= maxOv || wkts >= 10)) {
        status = 'Innings Break';
        target = score + 1;
        triggerAnim(`TARGET: ${target} 🎯`);
    } else if (innings === 2) {
        if (score >= target) {
            status = 'Finished';
            result = `${match.t2} WON BY ${10 - wkts} WICKETS! 🏆`;
            triggerAnim(result);
        } else if (ov >= maxOv || wkts >= 10) {
            status = 'Finished';
            result = `${match.t1} WON BY ${target - score - 1} RUNS! 🏆`;
            triggerAnim(result);
        }
    }

    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, status, target, result });
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <h2 style={{color:'#facc15'}}>Adhikot Pro Admin</h2>
          <input type="password" placeholder="Enter PIN" style={s.pinInput} value={pin}
            onChange={(e) => { setPin(e.target.value); if (e.target.value === "6545") setIsAdmin(true); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* 1. Live Red Animation Header */}
      <div style={s.header}>
        <div style={s.flex}>
           <div style={s.avatar}>T</div>
           <div><b>Touqeer Iqbal Baghoor</b><br/>
           <span style={s.livePulse}><FaCircle size={8} /> LIVE MATCH ACTIVE</span></div>
        </div>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3><FaCalendarAlt/> New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), t1: fd.get('t1'), t2: fd.get('t2'),
              maxOv: parseInt(fd.get('max')), date: fd.get('date'), time: fd.get('time'),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              score:0, wkts:0, ov:0, bl:0, innings: 1, status: 'Live', target: 0
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="gr" placeholder="Ground Name" style={s.input} required />
            <div style={s.flexGap}>
                <input name="date" type="date" style={s.input} required />
                <input name="time" type="time" style={s.input} required />
            </div>
            <div style={s.flexGap}><input name="t1" placeholder="Batting Team" style={s.input}/><input name="t2" placeholder="Bowling Team" style={s.input}/></div>
            <textarea name="t1p" placeholder="Team A (Name-Number, ...)" style={s.area}/>
            <textarea name="t2p" placeholder="Team B (Name-Number, ...)" style={s.area}/>
            <input name="max" placeholder="Total Overs" type="number" style={s.input} required/>
            <button type="submit" style={s.goldBtn}>START LIVE MATCH</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'12px', opacity:0.8}}>{match.date} | {match.time} | {match.gr}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>TARGET: {match.target}</div>}
            {match.result && <div style={s.resultBox}>{match.result}</div>}
          </div>

          {/* Scoring Controls - Visible to Admin */}
          {isAdmin && match.status !== 'Finished' && (
            <div style={s.grid}>
                {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                <button onClick={()=>handleScore(0,'wd')} style={s.exBtn}>WD</button>
                <button onClick={()=>handleScore(0,'nb')} style={s.exBtn}>NB</button>
                <button onClick={()=>handleScore(0,'wkt')} style={s.wktBtn}>WKT</button>
            </div>
          )}

          <div style={s.flexGap}>
             <button onClick={() => { 
                 if(match.innings === 1) update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0});
                 else { push(ref(db, 'history'), match); remove(ref(db, 'liveMatch')); }
             }} style={s.saveBtn}>{match.innings === 1 ? "Start 2nd Innings" : "Finish Match"}</button>
             <button onClick={() => setShowTeam('t1')} style={s.waBtn}><FaWhatsapp /> Share Status</button>
          </div>
        </div>
      )}

      {/* Player List with WhatsApp Status Trigger */}
      {showTeam && (
        <div style={s.overlay} onClick={() => setShowTeam(null)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3>Share Live Score</h3>
              {match.t1p.map(p => (
                <div key={p} style={s.dirItem} onClick={() => shareToWhatsApp(p.split('-')[1])}>
                  <span>{p.split('-')[0]}</span>
                  <FaWhatsapp size={22} color="#22c55e" />
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'2px solid #facc15' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  livePulse: { color:'#ef4444', fontSize:'10px', fontWeight:'bold', animation:'pulse 1.5s infinite' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'linear-gradient(180deg, #1e293b, #020617)', padding:'25px', borderRadius:'20px', textAlign:'center', border:'1px solid #334155', margin:'10px' },
  mainScore: { fontSize:'65px', fontWeight:'bold', color:'#facc15' },
  targetBox: { marginTop:'10px', color:'#facc15', fontWeight:'bold', fontSize:'18px' },
  resultBox: { marginTop:'15px', padding:'10px', background:'#22c55e', borderRadius:'10px', fontWeight:'bold' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', padding:'10px' },
  numBtn: { padding:'20px', background:'white', color:'black', borderRadius:'12px', fontWeight:'bold', fontSize:'22px' },
  exBtn: { padding:'20px', background:'#facc15', color:'black', borderRadius:'12px', fontWeight:'bold' },
  wktBtn: { padding:'20px', background:'#ef4444', color:'white', borderRadius:'12px', fontWeight:'bold' },
  flexGap: { display:'flex', gap:'10px', padding:'10px' },
  saveBtn: { flex:2, padding:'15px', background:'#22c55e', color:'white', borderRadius:'12px', fontWeight:'bold', border:'none' },
  waBtn: { flex:1, padding:'15px', background:'#075e54', color:'white', borderRadius:'12px', border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translate(-50%, -50%)', background:'#facc15', color:'black', padding:'30px', borderRadius:'50px', fontSize:'24px', fontWeight:'bold', zIndex:5000 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:6000 },
  modal: { background:'#0f172a', padding:'25px', borderRadius:'20px', width:'85%' },
  dirItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #1e293b' }
};
