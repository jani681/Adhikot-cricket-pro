import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProAdvanced() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [outModal, setOutModal] = useState(false);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsub = onValue(matchRef, (snap) => {
      if (snap.exists()) setMatch(snap.val());
      else setMatch(null);
    });
    return () => unsub();
  }, []);

  const handleScore = (runs, type = 'normal', isExtraRun = 0, isWicket = false) => {
    if (!match || match.status === 'Finished') return;
    let data = { ...match };
    let totalRunsThisBall = runs + isExtraRun;

    if (type === 'normal') {
      data.score += runs;
      data.bwr_r += runs;
      data.bl += 1;
      let p = data.active === 1 ? data.s1 : data.s2;
      p.r += runs; p.b += 1;
      if (runs === 4) p.fours += 1;
      if (runs === 6) p.sixes += 1;
      if (runs === 1 || runs === 3) data.active = data.active === 1 ? 2 : 1;
    } 
    else if (type === 'wd' || type === 'nb') {
      data.score += (1 + runs); // 1 for extra + extra runs taken
      data.bwr_r += (1 + runs);
      let p = data.active === 1 ? data.s1 : data.s2;
      if (type === 'nb') { p.r += runs; p.b += 1; if(runs === 4) p.fours += 1; if(runs === 6) p.sixes += 1; }
      if (runs === 1 || runs === 3) data.active = data.active === 1 ? 2 : 1;
    }

    if (isWicket) {
      data.wkts += 1;
      data.bwr_w += 1;
      setOutModal(true); // Open wicket detail modal
    }

    if (data.bl === 6) { data.ov += 1; data.bl = 0; data.bwr_o += 1; data.active = data.active === 1 ? 2 : 1; }
    
    // Auto-check innings end
    if (data.innings === 1 && (data.ov >= data.maxOv || data.wkts >= 10)) { data.status = 'Innings Break'; data.target = data.score + 1; }
    
    update(ref(db, 'liveMatch'), data);
  };

  const saveMatchToHistory = () => {
    if (!match) return;
    const historyRef = ref(db, `matchHistory/${Date.now()}`);
    set(historyRef, match).then(() => {
        alert("Match Saved to History!");
        remove(ref(db, 'liveMatch'));
    });
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <FaUserShield size={50} color="#facc15" />
          <h2 style={{color:'white'}}>Admin Access</h2>
          <input type="password" placeholder="Enter PIN" style={s.pinInput} onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.flexBetween}>
           <div style={s.flex}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small style={{color:'#ef4444'}}>● {match?.status || 'OFFLINE'}</small></div>
           </div>
           <FaWhatsapp size={24} color="#22c55e" onClick={() => window.open(`https://wa.me/923015800630?text=Score: ${match?.score}/${match?.wkts}`)}/>
        </div>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15'}}><FaTrophy/> New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), toss: fd.get('toss'), choice: fd.get('choice'), t1: fd.get('t1'), t2: fd.get('t2'), 
              date: new Date().toLocaleDateString(), maxOv: parseInt(fd.get('max')),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              s1: {n: 'Striker', r: 0, b: 0, fours: 0, sixes: 0}, s2: {n: 'Non-Striker', r: 0, b: 0, fours: 0, sixes: 0}, 
              active: 1, score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', bwr: 'Bowler', bwr_r:0, bwr_w:0, bwr_o:0
            });
          }}>
            <input name="lg" placeholder="Tournament Name" style={s.input} required />
            <div style={s.flexGap}>
                <input name="toss" placeholder="Who won toss?" style={s.input}/>
                <select name="choice" style={s.input}><option value="Batting">Batting</option><option value="Bowling">Bowling</option></select>
            </div>
            <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="t2" placeholder="Team B" style={s.input}/></div>
            <textarea name="t1p" placeholder="Team A Squad (Comma separated)" style={s.area}/>
            <textarea name="t2p" placeholder="Team B Squad (Comma separated)" style={s.area}/>
            <input name="max" placeholder="Total Overs" type="number" style={s.input}/>
            <button type="submit" style={s.goldBtn}>START LIVE SCOREBOARD</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>Target: {match.target}</div>}
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow} onClick={() => setSelModal(i === 0 ? 's1' : 's2')}>
                   <span>{p.n}{match.active === (i+1) ? '*' : ''}</span>
                   <span>{p.r}({p.b}) <small>4s:{p.fours} 6s:{p.sixes}</small></span>
                </div>
             ))}
             <div style={s.divider}></div>
             <div style={s.pRow} onClick={() => setSelModal('bwr')}>
                <span style={{color:'#60a5fa'}}>{match.bwr} (B)</span>
                <span>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
             </div>
          </div>

          {isAdmin && (
            <div style={s.adminPanel}>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                
                {/* Advanced Extra Buttons */}
                <button onClick={()=>handleScore(0, 'wd')} style={s.exBtn}>WD</button>
                <button onClick={()=>handleScore(1, 'wd')} style={s.exBtn}>WD+1</button>
                <button onClick={()=>handleScore(4, 'wd')} style={s.exBtn}>WD+4</button>
                
                <button onClick={()=>handleScore(0, 'nb')} style={s.nbBtn}>NB</button>
                <button onClick={()=>handleScore(1, 'nb')} style={s.nbBtn}>NB+1</button>
                <button onClick={()=>handleScore(4, 'nb')} style={s.nbBtn}>NB+4</button>
                <button onClick={()=>handleScore(6, 'nb')} style={s.nbBtn}>NB+6</button>

                <button onClick={()=>handleScore(0,'normal',0, true)} style={s.wktBtn}>OUT</button>
                <button onClick={()=>handleScore(0,'nb',0, true)} style={s.wktBtn}>NB+WKT</button>
              </div>

              <div style={s.flexGap}>
                <button onClick={saveMatchToHistory} style={s.saveBtn}><FaSave/> Save Match</button>
                <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}><FaTrash/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wicket Details Modal */}
      {outModal && (
        <div style={s.overlay}>
            <div style={s.modal}>
                <h3>How was the Wicket?</h3>
                {['Bold', 'Caught', 'Run Out', 'Stumped', 'LBW'].map(t => (
                    <button key={t} style={s.input} onClick={() => {
                        // Logic to record wicket type can be added to DB here
                        setOutModal(false);
                        setSelModal(match.active === 1 ? 's1' : 's2'); // Ask for new batsman
                    }}>{t}</button>
                ))}
            </div>
        </div>
      )}

      {/* Selection Modal (Players/Bowlers) */}
      {selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3>Select New {selModal === 'bwr' ? 'Bowler' : 'Batsman'}</h3>
              {(selModal === 'bwr' ? match.t2p : match.t1p).map((p, i) => (
                <div key={i} style={s.pItem} onClick={() => {
                    const up = {};
                    if(selModal==='s1') up.s1 = {n:p, r:0, b:0, fours:0, sixes:0};
                    if(selModal==='s2') up.s2 = {n:p, r:0, b:0, fours:0, sixes:0};
                    if(selModal==='bwr') up.bwr = p;
                    update(ref(db, 'liveMatch'), up);
                    setSelModal(null);
                }}>{p}</div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  authBox: { textAlign:'center', paddingTop:'100px' },
  pinInput: { padding:'12px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'8px', marginTop:'10px' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'12px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  flexGap: { display:'flex', gap:'10px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding:'25px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #334155' },
  mainScore: { fontSize:'55px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'18px', opacity:0.8 },
  targetBox: { background:'#facc15', color:'black', display:'inline-block', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold', marginTop:'10px' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', opacity:0.7 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'8px 0', color:'#facc15', fontWeight:'bold', borderLeft:'3px solid #facc15', paddingLeft:'10px' },
  divider: { height:'1px', background:'#334155', margin:'10px 0' },
  adminPanel: { marginTop:'15px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' },
  numBtn: { padding:'18px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'18px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  nbBtn: { padding:'18px', background:'#8b5cf6', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'18px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  saveBtn: { flex:2, padding:'15px', background:'#22c55e', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  delBtn: { flex:1, padding:'15px', background:'#b91c1c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', width:'90%', padding:'20px', borderRadius:'20px', textAlign:'center' },
  pItem: { padding:'15px', borderBottom:'1px solid #334155', fontSize:'18px' }
};
