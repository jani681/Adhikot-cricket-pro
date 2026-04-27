import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog, FaTimes, FaHistory, FaEdit } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProAdvanced() {
  const [match, setMatch] = useState(null);
  const [history, setHistory] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);
  const [anim, setAnim] = useState("");
  const [lastState, setLastState] = useState(null); 

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    onValue(matchRef, (snap) => {
      const data = snap.val();
      if (data) {
        if (data.innings === 2 && data.score >= data.target) {
          data.status = 'Finished';
          data.winner = data.batTeam;
        } else if (data.ov >= data.maxOv || data.wkts >= 10) {
          if (data.innings === 1) data.status = 'Innings Break';
          else {
             data.status = 'Finished';
             data.winner = data.score < data.target - 1 ? data.bowlTeam : 'Tie';
          }
        }
        setMatch(data);
      } else { setMatch(null); }
    });

    const historyRef = ref(db, 'matchHistory');
    onValue(historyRef, (snap) => {
      setHistory(snap.val() || {});
    });
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status === 'Finished' || match.status === 'Innings Break') return;
    if (match.ov >= match.maxOv || match.wkts >= 10) return;

    setLastState({...match}); 
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;

    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs; data.bl += 1;
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
      if (runs === 4) { striker.fours += 1; triggerAnim("FOUR! ✨"); }
      if (runs === 6) { striker.sixes += 1; triggerAnim("SIXER! 🚀"); }
    } else if (type === 'wd') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      triggerAnim(`WIDE +${runs}`);
    } else if (type === 'nb') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
      triggerAnim(`NO BALL +${runs}`);
    }

    if (outType) {
      data.wkts += 1; data.bwr_w += (outType !== 'Run Out' ? 1 : 0);
      if (type === 'normal') data.bl += 1;
      striker.r = `OUT (${outType})`;
      triggerAnim(`WICKET! (${outType}) ☝️`);
      setTimeout(() => setSelModal(data.active === 1 ? 's1' : 's2'), 500);
    }

    if (runs % 2 !== 0 && type !== 'wd') data.active = data.active === 1 ? 2 : 1;
    if (data.bl === 6) { data.ov += 1; data.bl = 0; data.bwr_o += 1; data.active = data.active === 1 ? 2 : 1; triggerAnim("OVER! 🔄"); }
    
    if (data.innings === 2 && data.score >= data.target) {
      data.status = 'Finished';
    } else if (data.ov >= data.maxOv || data.wkts >= 10) {
      data.status = data.innings === 1 ? 'Innings Break' : 'Finished';
    }

    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };

  const undoLastAction = () => {
    if (lastState) {
      update(ref(db, 'liveMatch'), lastState);
      setLastState(null);
      alert("Last Action Undone!");
    }
  };

  const saveMatchToHistory = () => {
    if (!match) return;
    push(ref(db, 'matchHistory'), { ...match, timestamp: Date.now() });
    alert("Match Saved to History!");
  };

  const closeMatch = () => {
    if (window.confirm("Are you sure you want to close this match?")) {
      remove(ref(db, 'liveMatch'));
      alert("Match Closed!");
    }
  };

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}><div style={s.flexBetween}>
           <div style={s.flex} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN ACTIVE' : 'LIVE'}</small></div>
           </div>
           <div style={s.flex}>
             <FaHistory size={20} style={{cursor:'pointer', color:'#facc15'}} onClick={() => setShowHistory(true)} />
             <FaCog size={20} style={{opacity:0.5, marginLeft:'15px'}} onClick={() => setShowAuth(true)} />
           </div>
      </div></div>

      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <input type="password" placeholder="ENTER PIN" style={s.pinInput} onChange={(e) => { if(e.target.value === "6545") { setIsAdmin(true); setShowAuth(false); }}} />
          </div>
        </div>
      )}

      {showHistory && (
        <div style={s.overlay} onClick={() => setShowHistory(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.flexBetween}>
                <h3 style={{color:'#facc15'}}>Match History</h3>
                {isAdmin && <button onClick={() => remove(ref(db, 'matchHistory'))} style={{background:'none', border:'none', color:'#ef4444'}}><FaTrash/> Clear All</button>}
            </div>
            <div style={{maxHeight:'60vh', overflowY:'auto', marginTop:'15px'}}>
                {Object.keys(history).length === 0 ? <p>No history found.</p> : 
                 Object.entries(history).reverse().map(([id, m]) => (
                    <div key={id} style={s.historyItem}>
                        <div style={s.flexBetween}><small>{m.date}</small></div>
                        <div style={{fontWeight:'bold'}}>{m.t1} vs {m.t2}</div>
                        <div style={{color:'#facc15'}}>{m.score}/{m.wkts} ({m.ov}.{m.bl})</div>
                    </div>
                ))}
            </div>
            <button onClick={() => setShowHistory(false)} style={s.goldBtn}>CLOSE</button>
          </div>
        </div>
      )}

      {!match ? (
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15'}}><FaTrophy/> New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const t1 = fd.get('t1'), t2 = fd.get('t2');
            const batFirst = fd.get('batFirst');
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), t1, t2, c1: fd.get('c1'), c2: fd.get('c2'), 
              emp: fd.get('emp'), date: fd.get('date'), time: fd.get('time'), maxOv: parseInt(fd.get('max')),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              batTeam: batFirst === 'T1' ? t1 : t2, bowlTeam: batFirst === 'T1' ? t2 : t1,
              s1: {n: 'Striker', r: 0, b: 0, fours: 0, sixes: 0}, s2: {n: 'Non-Striker', r: 0, b: 0, fours: 0, sixes: 0}, 
              active: 1, score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', bwr: 'Bowler', bwr_r:0, bwr_w:0, bwr_o:0
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="c1" placeholder="Capt A" style={s.input}/></div>
            <div style={s.flexGap}><input name="t2" placeholder="Team B" style={s.input}/><input name="c2" placeholder="Capt B" style={s.input}/></div>
            <select name="batFirst" style={s.input} required>
                <option value="">Select Batting First</option>
                <option value="T1">Team A Batting First</option>
                <option value="T2">Team B Batting First</option>
            </select>
            <textarea name="t1p" placeholder="Team A Players (comma separated)" style={s.area}/><textarea name="t2p" placeholder="Team B Players (comma separated)" style={s.area}/>
            <div style={s.flexGap}><input name="max" placeholder="Overs" type="number" style={s.input}/><button type="submit" style={s.goldBtn}>START LIVE</button></div>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            {match.status === 'Finished' && <div style={s.winBanner}>{match.winner} WON! 🏆</div>}
            <div style={{fontSize:'16px', fontWeight:'bold'}}>{match.batTeam} vs {match.bowlTeam}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>Target: {match.target}</div>}
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow} onClick={() => isAdmin && setSelModal(i === 0 ? 's1' : 's2')}>
                   <span>{p.n}{match.active === (i+1) ? '*' : ''}</span>
                   <span>{p.r}({p.b})</span>
                </div>
             ))}
             <div style={s.divider}></div>
             <div style={s.pRow} onClick={() => isAdmin && setSelModal('bwr')}>
                <span style={{color:'#60a5fa'}}>{match.bwr} (B)</span>
                <span>{match.bwr_w}/{match.bwr_r}</span>
             </div>
          </div>

          {isAdmin && (
            <div style={s.adminGrid}>
              {match.status !== 'Finished' && (
                <>
                  {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                  <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD+</button>
                  <button onClick={()=>setExtraModal('nb')} style={s.nbBtn}>NB+</button>
                  <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
                  <button onClick={undoLastAction} style={s.editBtn}><FaEdit/> EDIT</button>
                </>
              )}
              
              <div style={{gridColumn:'span 3', display:'flex', gap:'10px', marginTop:'10px'}}>
                {match.status === 'Innings Break' && (
                  <button onClick={() => update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1, status: 'Live', batTeam: match.bowlTeam, bowlTeam: match.batTeam})} style={s.saveBtn}>START 2ND INN</button>
                )}
                <button onClick={saveMatchToHistory} style={s.saveBtn}><FaSave/> SAVE</button>
                {match.status === 'Finished' && (
                  <button onClick={closeMatch} style={s.delBtn}><FaTimes/> CLOSE & START NEW</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {extraModal && (
        <div style={s.overlay}><div style={s.modal}>
          <h3>{extraModal === 'wd' ? 'Wide' : 'No Ball'} Options</h3>
          <div style={s.grid3}>
            {[0,1,2,3,4,6].map(v => <button key={v} onClick={()=>handleScore(v, extraModal)} style={s.numBtn}>+{v}</button>)}
            <button onClick={()=>setExtraModal(null)} style={s.delBtn}>CLOSE</button>
          </div>
        </div></div>
      )}

      {wktModal && (
        <div style={s.overlay}><div style={s.modal}>
          <h3>Dismissal Type</h3>
          {['Bold', 'Caught', 'Run Out', 'LBW', 'Stumped'].map(t => (
            <button key={t} onClick={()=>handleScore(0, 'normal', t)} style={s.pItem}>{t}</button>
          ))}
          <button onClick={()=>setWktModal(false)} style={s.delBtn}>CANCEL</button>
        </div></div>
      )}

      {isAdmin && selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}><div style={s.modal} onClick={e => e.stopPropagation()}>
          <h3>Select {selModal === 'bwr' ? 'Bowler' : 'Batsman'}</h3>
          {(selModal === 'bwr' ? (match.batTeam === match.t1 ? match.t2p : match.t1p) : (match.batTeam === match.t1 ? match.t1p : match.t2p)).map((p, i) => (
            <div key={i} style={s.pItem} onClick={() => {
                const up = {};
                if(selModal==='s1') up.s1 = {n:p, r:0, b:0, fours:0, sixes:0};
                if(selModal==='s2') up.s2 = {n:p, r:0, b:0, fours:0, sixes:0};
                if(selModal==='bwr') up.bwr = p;
                update(ref(db, 'liveMatch'), up); setSelModal(null);
            }}>{p}</div>
          ))}
        </div></div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  winBanner: { background:'#22c55e', color:'white', padding:'10px', borderRadius:'10px', marginBottom:'15px', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  flexGap: { display:'flex', gap:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #334155' },
  mainScore: { fontSize:'55px', fontWeight:'bold', color:'#facc15' },
  targetBox: { background:'#facc15', color:'black', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold', marginTop:'10px', display:'inline-block' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', opacity:0.7 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'8px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#334155', margin:'10px 0' },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', padding:'10px' },
  grid3: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  nbBtn: { padding:'15px', background:'#8b5cf6', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  editBtn: { padding:'15px', background:'#3b82f6', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  saveBtn: { flex:1, padding:'12px', background:'#22c55e', color:'white', borderRadius:'8px', fontWeight:'bold', border:'none' },
  delBtn: { flex:1, padding:'12px', background:'#b91c1c', color:'white', borderRadius:'8px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'20px', textAlign:'center' },
  historyItem: { background:'#0f172a', padding:'12px', borderRadius:'10px', marginBottom:'10px', textAlign:'left', borderLeft:'4px solid #facc15' },
  pItem: { width:'100%', padding:'12px', background:'#0f172a', color:'white', border:'none', borderBottom:'1px solid #334155', textAlign:'left' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:6000 },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center' },
  overInfo: { fontSize:'18px', opacity:0.8 }
};
