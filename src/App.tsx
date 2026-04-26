import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaLock, FaTrashAlt, FaHistory, FaSyncAlt, FaCalendarAlt, FaUserEdit } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProUltimate() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTeam, setShowTeam] = useState(null); // 't1', 't2', 'bowlers'
  const [anim, setAnim] = useState("");

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 2500); };

  const handleScore = (runs, type = 'normal') => {
    if (!match) return;
    let { score, wkts, bl, ov, freeHit, s1Runs, s1Balls, s2Runs, s2Balls, onStrike, bRuns, bWkts, bBl } = { ...match };

    if (type === 'wkt') {
      if (!freeHit) {
        wkts += 1; bWkts += 1; bl += 1; bBl += 1;
        if (onStrike === 1) { s1Runs = 0; s1Balls = 0; } else { s2Runs = 0; s2Balls = 0; }
        triggerAnim("OUT! ☝️");
      } else {
        triggerAnim("NOT OUT (Free Hit)! 🛡️");
        freeHit = false; bl += 1; bBl += 1;
      }
    } else if (type === 'normal') {
      score += runs; bl += 1; bBl += 1; bRuns += runs;
      if (onStrike === 1) { s1Runs += runs; s1Balls += 1; if (runs % 2 !== 0) onStrike = 2; }
      else { s2Runs += runs; s2Balls += 1; if (runs % 2 !== 0) onStrike = 1; }
      if (runs === 4) triggerAnim("FOUR! ✨");
      if (runs === 6) triggerAnim("SIXER! 🚀");
      freeHit = false;
    } else if (type === 'wd' || type === 'nb') {
      score += 1; bRuns += 1;
      if (type === 'nb') { freeHit = true; triggerAnim("FREE HIT! ⚡"); }
      else triggerAnim("WIDE! ↔️");
    }

    if (bl === 6) { ov += 1; bl = 0; bBl = 0; onStrike = (onStrike === 1 ? 2 : 1); triggerAnim("OVER END! 🔄"); }
    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, freeHit, s1Runs, s1Balls, s2Runs, s2Balls, onStrike, bRuns, bWkts, bBl });
  };

  // UI Selection Modals
  const SelectionModal = ({ type }) => {
    const list = type === 'bowlers' ? match.t2p : (type === 's1' ? match.t1p : match.t1p);
    return (
      <div style={s.overlay} onClick={() => setShowTeam(null)}>
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <h3>Select Player</h3>
          {list.map(p => (
            <div key={p} style={s.dirItem} onClick={() => {
              update(ref(db, 'liveMatch'), { [type]: p.split('-')[0] });
              setShowTeam(null);
            }}>
              <span>{p.split('-')[0]}</span>
              <FaUserEdit color="#facc15" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <FaLock size={40} color="#facc15" />
          <h2 style={{color:'white'}}>Admin Login</h2>
          <input type="password" placeholder="PIN (6545)" style={s.pinInput} 
            onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}>
        <div style={s.flex}>
           <div style={s.avatar}>T</div>
           <div><b style={{fontSize:'14px'}}>Touqeer Iqbal Baghoor</b><br/><span style={{color:'#22c55e', fontSize:'10px'}}>● Admin Active</span></div>
        </div>
        <a href="https://wa.me/923015800630" style={s.waHeader}><FaWhatsapp /></a>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3><FaCalendarAlt/> Match Configuration</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), t1: fd.get('t1'), t2: fd.get('t2'),
              ump: fd.get('ump'), maxOv: fd.get('max'), dt: fd.get('dt'), tm: fd.get('tm'),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              score:0, wkts:0, ov:0, bl:0, onStrike:1,
              s1:"Striker", s1Runs:0, s1Balls:0, s2:"Non-Striker", s2Runs:0, s2Balls:0,
              bowler:"Bowler", bRuns:0, bWkts:0, bBl:0, freeHit: false
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="gr" placeholder="Ground" style={s.input} required />
            <div style={s.flexGap}>
              <input name="dt" type="date" style={s.input} required />
              <input name="tm" type="time" style={s.input} required />
            </div>
            <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="t2" placeholder="Team B" style={s.input}/></div>
            <textarea name="t1p" placeholder="Team A Squad (Name-92xxx, ...)" style={s.area}/>
            <textarea name="t2p" placeholder="Team B Squad (Name-92xxx, ...)" style={s.area}/>
            <input name="max" placeholder="Overs" type="number" style={s.input}/>
            <input name="ump" placeholder="Umpire" style={s.input}/>
            <button type="submit" style={s.goldBtn}>START LIVE MATCH</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'12px', opacity:0.7}}>{match.gr} | {match.dt} {match.tm}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.rrBox}>RR: {(match.score / (match.ov + match.bl/6) || 0).toFixed(2)}</div>
          </div>

          <div style={s.pCard}>
            <div style={match.onStrike === 1 ? s.activeP : s.pRow} onClick={() => setShowTeam('s1')}>
               <span>{match.s1}*</span><span>{match.s1Runs}({match.s1Balls})</span>
            </div>
            <div style={match.onStrike === 2 ? s.activeP : s.pRow} onClick={() => setShowTeam('s2')}>
               <span>{match.s2}</span><span>{match.s2Runs}({match.s2Balls})</span>
            </div>
            <hr style={{borderColor:'#1e293b'}}/>
            <div style={s.pRow} onClick={() => setShowTeam('bowlers')}>
               <span>{match.bowler}</span><span>{match.bWkts}/{match.bRuns} ({Math.floor(match.bBl/6)}.{match.bBl%6})</span>
            </div>
          </div>

          <div style={s.grid}>
            {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
            <button onClick={()=>handleScore(0,'wd')} style={s.exBtn}>WD</button>
            <button onClick={()=>handleScore(0,'nb')} style={s.exBtn}>NB</button>
            <button onClick={()=>handleScore(0,'wkt')} style={s.wktBtn}>WKT</button>
          </div>

          <div style={s.flexGap}>
             <button onClick={() => { push(ref(db, 'history'), match); remove(ref(db, 'liveMatch')); }} style={s.saveBtn}>Save</button>
             <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}>Delete</button>
          </div>
        </div>
      )}

      {showTeam && <SelectionModal type={showTeam} />}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white' },
  authBox: { textAlign:'center', marginTop:'150px' },
  pinInput: { padding:'15px', background:'#0f172a', border:'1px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', marginTop:'10px' },
  header: { background:'#0f172a', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #facc15' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  waHeader: { background:'#22c55e', width:'35px', height:'35px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'linear-gradient(180deg, #1e293b, #020617)', padding:'20px', borderRadius:'20px', textAlign:'center', border:'1px solid #334155' },
  mainScore: { fontSize:'60px', fontWeight:'bold', color:'#facc15' },
  rrBox: { background:'#0f172a', padding:'5px 15px', borderRadius:'20px', fontSize:'12px', color:'#facc15', display:'inline-block' },
  pCard: { background:'#0f172a', padding:'15px', borderRadius:'15px', margin:'15px 0' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'10px 0', opacity:0.6 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'10px 0', color:'#facc15', fontWeight:'bold' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' },
  numBtn: { padding:'20px', background:'white', color:'black', borderRadius:'12px', fontWeight:'bold', fontSize:'22px' },
  exBtn: { padding:'20px', background:'#facc15', color:'black', borderRadius:'12px', border:'none', fontWeight:'bold' },
  wktBtn: { padding:'20px', background:'#ef4444', color:'white', borderRadius:'12px', border:'none', fontWeight:'bold' },
  flexGap: { display:'flex', gap:'10px', marginTop:'15px' },
  saveBtn: { flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:'8px' },
  delBtn: { flex:1, padding:'12px', background:'transparent', border:'1px solid #ef4444', color:'#ef4444', borderRadius:'8px' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translate(-50%, -50%)', background:'#facc15', color:'black', padding:'25px 50px', borderRadius:'50px', fontSize:'30px', fontWeight:'bold', zIndex:1000, boxShadow:'0 0 20px #facc15' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal: { background:'#0f172a', padding:'25px', borderRadius:'20px', width:'85%' },
  dirItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #1e293b' }
};
