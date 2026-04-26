import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaCircle, FaUserShield, FaCalendarAlt } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProUltimate() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleScore = (runs, type = 'normal') => {
    if (!match || match.status === 'Finished') return;
    
    let { score, wkts, bl, ov, maxOv, target, innings, s1, s2, active, bwr, bwr_r, bwr_w, bwr_o } = { ...match };

    if (type === 'wkt') {
        wkts += 1;
        bwr_w += 1;
        active === 1 ? s1.r = "OUT" : s2.r = "OUT"; 
    } else if (type === 'normal') {
        score += runs;
        bwr_r += runs;
        bl += 1;
        active === 1 ? (s1.r += runs, s1.b += 1) : (s2.r += runs, s2.b += 1);
        
        // Strike Rotation on odd runs
        if (runs === 1 || runs === 3) active = active === 1 ? 2 : 1;
    } else if (type === 'wd' || type === 'nb') {
        score += 1;
        bwr_r += 1;
    }

    if (bl === 6) { 
        ov += 1; bl = 0; 
        bwr_o += 1;
        active = active === 1 ? 2 : 1; // Change strike on over end
    }

    // Win/Loss & Target Logic
    let status = 'Live';
    let result = '';
    
    if (innings === 1 && (ov >= maxOv || wkts >= 10)) {
        status = 'Innings Break';
        target = score + 1;
    } else if (innings === 2) {
        if (score >= target) {
            status = 'Finished';
            result = `${match.t2} Won by ${10 - wkts} Wickets! 🏆`;
        } else if (ov >= maxOv || wkts >= 10) {
            status = 'Finished';
            result = `${match.t1} Won by ${target - score - 1} Runs! 🏆`;
        }
    }

    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, status, target, result, s1, s2, active, bwr_r, bwr_w, bwr_o });
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <h2 style={{color:'#facc15'}}>Adhikot Pro Admin</h2>
          <input type="password" placeholder="Enter Admin PIN" style={s.pinInput} 
            onChange={(e) => { if (e.target.value === "6545") setIsAdmin(true); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Header with WhatsApp Admin Icon */}
      <div style={s.header}>
        <div style={s.flex}>
           <div style={s.avatar}>T</div>
           <div style={{flex:1}}>
             <b>Touqeer Iqbal Baghoor</b><br/>
             <span style={s.livePulse}><FaCircle size={8} /> LIVE MATCH ACTIVE</span>
           </div>
           <a href="https://wa.me/yournumber" style={s.waIcon}><FaWhatsapp size={22}/></a>
        </div>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15'}}><FaCalendarAlt/> Match Details</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), emp: fd.get('emp'),
              t1: fd.get('t1'), t2: fd.get('t2'), date: fd.get('date'),
              maxOv: parseInt(fd.get('max')), active: 1,
              s1: {n: fd.get('s1'), r: 0, b: 0}, s2: {n: fd.get('s2'), r: 0, b: 0},
              bwr: fd.get('bwr'), bwr_r: 0, bwr_w: 0, bwr_o: 0,
              score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', target: 0
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <div style={s.flexGap}>
                <input name="gr" placeholder="Ground" style={s.input}/>
                <input name="emp" placeholder="Umpire Name" style={s.input}/>
            </div>
            <div style={s.flexGap}>
                <input name="date" type="date" style={s.input}/>
                <input name="max" placeholder="Overs" type="number" style={s.input}/>
            </div>
            <input name="t1" placeholder="Batting Team" style={s.input}/>
            <div style={s.flexGap}>
                <input name="s1" placeholder="Striker" style={s.input}/>
                <input name="s2" placeholder="Non-Striker" style={s.input}/>
            </div>
            <input name="t2" placeholder="Bowling Team" style={s.input}/>
            <input name="bwr" placeholder="Current Bowler" style={s.input}/>
            <button type="submit" style={s.goldBtn}>START LIVE MATCH</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={s.meta}>{match.date} | {match.gr} | Ump: {match.emp}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>TARGET: {match.target}</div>}
            {match.result && <div style={s.resultBox}>{match.result}</div>}
          </div>

          {/* Striker/Non-Striker & Bowler System */}
          <div style={s.playerCard}>
             <div style={match.active === 1 ? s.activeP : s.pRow}>
                <span>{match.s1.n}*</span> <span>{match.s1.r}({match.s1.b})</span>
             </div>
             <div style={match.active === 2 ? s.activeP : s.pRow}>
                <span>{match.s2.n}</span> <span>{match.s2.r}({match.s2.b})</span>
             </div>
             <div style={s.divider}></div>
             <div style={s.pRow}>
                <span>{match.bwr} (Bowler)</span> <span>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
             </div>
          </div>

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
                 if(match.innings === 1) update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1});
                 else remove(ref(db, 'liveMatch'));
             }} style={s.saveBtn}>{match.innings === 1 ? "Start 2nd Innings" : "New Match"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #334155' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  waIcon: { color:'#22c55e', background:'#1e293b', padding:'8px', borderRadius:'50%', display:'flex' },
  livePulse: { color:'#ef4444', fontSize:'10px', fontWeight:'bold' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px', marginTop:'10px' },
  card: { background:'#1e293b', padding:'25px', borderRadius:'20px', textAlign:'center', margin:'10px' },
  mainScore: { fontSize:'60px', fontWeight:'bold', color:'#facc15' },
  targetBox: { color:'#facc15', fontWeight:'bold', fontSize:'20px', marginTop:'10px' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', opacity:0.7 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'8px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#334155', margin:'10px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', padding:'10px' },
  numBtn: { padding:'18px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', fontSize:'20px' },
  exBtn: { padding:'18px', background:'#facc15', color:'black', borderRadius:'10px', fontWeight:'bold' },
  wktBtn: { padding:'18px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold' },
  saveBtn: { width:'100%', padding:'15px', background:'#22c55e', color:'white', borderRadius:'12px', fontWeight:'bold', border:'none' }
};
