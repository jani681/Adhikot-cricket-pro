import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaLock, FaTrashAlt, FaHistory, FaSyncAlt, FaCalendarAlt } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProIntelligent() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTeam, setShowTeam] = useState(null);
  const [anim, setAnim] = useState("");

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 2500); };

  const handleScore = (runs, type = 'normal') => {
    if (!match || (match.wkts >= 10 && type === 'wkt')) return; // Cricketing Limit

    let { score, wkts, bl, ov, freeHit, s1Runs, s1Balls, s2Runs, s2Balls, onStrike, bRuns, bWkts, bBl } = { ...match };

    if (type === 'normal') {
      score += runs; bl += 1; bBl += 1; bRuns += runs;
      if (onStrike === 1) { s1Runs += runs; s1Balls += 1; if (runs % 2 !== 0) onStrike = 2; }
      else { s2Runs += runs; s2Balls += 1; if (runs % 2 !== 0) onStrike = 1; }
      if (runs === 4) triggerAnim("FOUR! ✨");
      if (runs === 6) triggerAnim("SIXER! 🚀");
      freeHit = false;
    } else if (type === 'wd' || type === 'nb') {
      score += 1; bRuns += 1;
      if (type === 'nb') { freeHit = true; triggerAnim("FREE HIT! ⚡"); }
    } else if (type === 'wkt' && !freeHit) {
      wkts += 1; bWkts += 1; bl += 1; bBl += 1;
      if (onStrike === 1) { s1Runs = 0; s1Balls = 0; } else { s2Runs = 0; s2Balls = 0; }
      triggerAnim("WICKET! ☝️");
    }

    if (bl === 6) { ov += 1; bl = 0; bBl = 0; onStrike = (onStrike === 1 ? 2 : 1); } // Over End Logic
    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, freeHit, s1Runs, s1Balls, s2Runs, s2Balls, onStrike, bRuns, bWkts, bBl });
  };

  const saveMatch = () => {
    push(ref(db, 'history'), { ...match, date: new Date().toLocaleString() });
    remove(ref(db, 'liveMatch'));
    alert("Match Saved to History!");
  };

  // 1. Password Protected Admin Panel
  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <FaLock size={40} color="#facc15" />
          <h2 style={{color:'white'}}>Admin Access</h2>
          <input type="password" placeholder="PIN" style={s.pinInput} 
            onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* Header */}
      <div style={s.header}>
        <div style={s.flex}>
           <div style={s.avatar}>T</div>
           <div><b style={{fontSize:'14px'}}>Touqeer Iqbal Baghoor</b><br/><span style={{color:'#22c55e', fontSize:'10px'}}>● Admin Active</span></div>
        </div>
        <a href="https://wa.me/923015800630" style={s.waHeader}><FaWhatsapp /></a>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3><FaCalendarAlt/> New Match Details</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), t1: fd.get('t1'), t2: fd.get('t2'),
              ump: fd.get('ump'), maxOv: fd.get('max'), dt: new Date().toLocaleDateString(),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              score:0, wkts:0, ov:0, bl:0, onStrike:1,
              s1:"Striker", s1Runs:0, s1Balls:0, s2:"Non-Striker", s2Runs:0, s2Balls:0,
              bowler:"Bowler", bRuns:0, bWkts:0, bBl:0
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="gr" placeholder="Ground" style={s.input} required />
            <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="t2" placeholder="Team B" style={s.input}/></div>
            <textarea name="t1p" placeholder="Team A Players (Name-Number, ...)" style={s.area}/>
            <textarea name="t2p" placeholder="Team B Players (Name-Number, ...)" style={s.area}/>
            <input name="max" placeholder="Total Overs" type="number" style={s.input}/>
            <input name="ump" placeholder="Umpire" style={s.input}/>
            <button type="submit" style={s.goldBtn}>START LIVE</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          {/* Scoreboard with RR */}
          <div style={s.card}>
            <div style={{fontSize:'12px', opacity:0.7}}>{match.gr} | {match.dt}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.rrBox}>RR: {(match.score / (match.ov + match.bl/6) || 0).toFixed(2)}</div>
            <div style={s.teams}>
               <span onClick={()=>setShowTeam('t1')} style={s.tLink}>{match.t1}</span> vs <span onClick={()=>setShowTeam('t2')} style={s.tLink}>{match.t2}</span>
            </div>
          </div>

          {/* Intelligent Player Management */}
          <div style={s.pCard}>
            <div style={match.onStrike === 1 ? s.activeP : s.pRow}>
               <input style={s.pIn} value={match.s1} onChange={(e)=>update(ref(db,'liveMatch'),{s1:e.target.value})}/>
               <span>{match.s1Runs}({match.s1Balls})</span>
            </div>
            <div style={match.onStrike === 2 ? s.activeP : s.pRow}>
               <input style={s.pIn} value={match.s2} onChange={(e)=>update(ref(db,'liveMatch'),{s2:e.target.value})}/>
               <span>{match.s2Runs}({match.s2Balls})</span>
            </div>
            <hr style={{borderColor:'#1e293b'}}/>
            <div style={s.pRow}>
               <input style={s.pIn} value={match.bowler} onChange={(e)=>update(ref(db,'liveMatch'),{bowler:e.target.value})}/>
               <span>{match.bWkts}/{match.bRuns} ({Math.floor(match.bBl/6)}.{match.bBl%6})</span>
            </div>
          </div>

          {/* Controls */}
          <div style={s.grid}>
            {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
            <button onClick={()=>handleScore(0,'wd')} style={s.exBtn}>WD</button>
            <button onClick={()=>handleScore(0,'nb')} style={s.exBtn}>NB</button>
            <button onClick={()=>handleScore(0,'wkt')} style={s.wktBtn}>WKT</button>
          </div>

          <div style={s.flexGap}>
             <button onClick={saveMatch} style={s.saveBtn}><FaHistory/> Save</button>
             <button onClick={()=>remove(ref(db,'liveMatch'))} style={s.delBtn}><FaTrashAlt/> Delete</button>
          </div>
        </div>
      )}

      {/* Directory Modal */}
      {showTeam && (
        <div style={s.overlay} onClick={()=>setShowTeam(null)}>
           <div style={s.modal} onClick={e=>e.stopPropagation()}>
              <h3>{showTeam === 't1' ? match.t1 : match.t2} Squad</h3>
              {(showTeam === 't1' ? match.t1p : match.t2p).map(p => (
                <div key={p} style={s.dirItem}>
                  <span>{p.split('-')[0]}</span>
                  <a href={`https://wa.me/${p.split('-')[1]}`} style={{color:'#22c55e'}}><FaWhatsapp size={20}/></a>
                </div>
              ))}
              <button onClick={()=>setShowTeam(null)} style={s.goldBtn}>Close</button>
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  authBox: { textAlign:'center', marginTop:'150px', padding:'20px' },
  pinInput: { padding:'15px', background:'#0f172a', border:'1px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', marginTop:'10px' },
  header: { background:'#0f172a', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #facc15' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  waHeader: { background:'#22c55e', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'linear-gradient(180deg, #1e293b, #020617)', padding:'20px', borderRadius:'20px', textAlign:'center', border:'1px solid #334155' },
  mainScore: { fontSize:'60px', fontWeight:'bold', color:'#facc15' },
  rrBox: { background:'#0f172a', display:'inline-block', padding:'5px 15px', borderRadius:'20px', fontSize:'12px', color:'#facc15', margin:'5px' },
  tLink: { color:'#facc15', textDecoration:'underline' },
  pCard: { background:'#0f172a', padding:'15px', borderRadius:'15px', margin:'15px 0' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', opacity:0.6 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'8px 0', color:'#facc15', fontWeight:'bold' },
  pIn: { background:'transparent', border:'none', color:'inherit', outline:'none', width:'60%' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' },
  numBtn: { padding:'20px', background:'white', color:'black', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'20px' },
  exBtn: { padding:'20px', background:'#facc15', color:'black', borderRadius:'12px', border:'none', fontWeight:'bold' },
  wktBtn: { padding:'20px', background:'#ef4444', color:'white', borderRadius:'12px', border:'none', fontWeight:'bold' },
  flexGap: { display:'flex', gap:'10px', marginTop:'15px' },
  saveBtn: { flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:'8px' },
  delBtn: { flex:1, padding:'12px', background:'transparent', border:'1px solid #ef4444', color:'#ef4444', borderRadius:'8px' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translate(-50%, -50%)', background:'#facc15', color:'black', padding:'20px 40px', borderRadius:'50px', fontSize:'25px', fontWeight:'bold', zIndex:1000 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal: { background:'#0f172a', padding:'25px', borderRadius:'20px', width:'85%' },
  dirItem: { display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #1e293b' }
};
