import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProAdminFix() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [anim, setAnim] = useState("");

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal', isWicket = false) => {
    if (!match || match.status === 'Finished') return;
    let data = { ...match };
    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs; data.bl += 1;
      let p = data.active === 1 ? data.s1 : data.s2;
      p.r = (parseInt(p.r) || 0) + runs; p.b += 1;
      if (runs === 4) { p.fours += 1; triggerAnim("FOUR! ✨"); }
      if (runs === 6) { p.sixes += 1; triggerAnim("SIXER! 🚀"); }
      if (runs === 1 || runs === 3) data.active = data.active === 1 ? 2 : 1;
    } 
    else {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      if (type === 'nb') { let p = data.active === 1 ? data.s1 : data.s2; p.r = (parseInt(p.r) || 0) + runs; p.b += 1; }
      if (runs === 1 || runs === 3) data.active = data.active === 1 ? 2 : 1;
      triggerAnim(type === 'wd' ? "WIDE" : "NO BALL");
    }
    if (isWicket) { data.wkts += 1; data.bwr_w += 1; if (type === 'normal') data.bl += 1; triggerAnim("OUT! ☝️"); }
    if (data.bl === 6) { data.ov += 1; data.bl = 0; data.bwr_o += 1; data.active = data.active === 1 ? 2 : 1; triggerAnim("OVER! 🔄"); }
    update(ref(db, 'liveMatch'), data);
  };

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* Dynamic Header with Admin Toggle */}
      <div style={s.header}><div style={s.flexBetween}>
           <div style={s.flex} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN ACTIVE' : 'LIVE'}</small></div>
           </div>
           <div style={s.flex}>
             <FaCog size={20} style={{marginRight:'15px', opacity:0.5}} onClick={() => setShowAuth(true)} />
             <FaWhatsapp size={24} color="#22c55e" onClick={() => window.open(`https://wa.me/923015800630?text=Score: ${match?.score}/${match?.wkts}`)}/>
           </div>
      </div></div>

      {/* Admin PIN Overlay */}
      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <FaUserShield size={40} color="#facc15" />
            <h3 style={{color:'white'}}>Enter Admin PIN</h3>
            <input type="password" autoFocus style={s.pinInput} onChange={(e) => { if(e.target.value === "6545") { setIsAdmin(true); setShowAuth(false); }}} />
          </div>
        </div>
      )}

      {!match ? (
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15'}}><FaTrophy/> New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), t1: fd.get('t1'), t2: fd.get('t2'), c1: fd.get('c1'), c2: fd.get('c2'), 
              emp: fd.get('emp'), date: fd.get('date'), time: fd.get('time'), maxOv: parseInt(fd.get('max')),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              s1: {n: 'Striker', r: 0, b: 0, fours: 0, sixes: 0}, s2: {n: 'Non-Striker', r: 0, b: 0, fours: 0, sixes: 0}, 
              active: 1, score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', bwr: 'Bowler', bwr_r:0, bwr_w:0, bwr_o:0
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="c1" placeholder="Capt A" style={s.input}/></div>
            <div style={s.flexGap}><input name="t2" placeholder="Team B" style={s.input}/><input name="c2" placeholder="Capt B" style={s.input}/></div>
            <input name="emp" placeholder="Empire Name" style={s.input}/>
            <textarea name="t1p" placeholder="Team A Squad (Names...)" style={s.area}/><textarea name="t2p" placeholder="Team B Squad (Names...)" style={s.area}/>
            <div style={s.flexGap}><input name="date" type="date" style={s.input}/><input name="time" type="time" style={s.input}/></div>
            <input name="max" placeholder="Total Overs" type="number" style={s.input}/><button type="submit" style={s.goldBtn}>START MATCH</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <small style={{opacity:0.6}}>{match.date} | {match.time} | Empire: {match.emp}</small>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>Target: {match.target}</div>}
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow} onClick={() => isAdmin && setSelModal(i === 0 ? 's1' : 's2')}>
                   <span>{p.n}{match.active === (i+1) ? '*' : ''} {isAdmin && <FaSyncAlt size={10}/>}</span>
                   <span>{p.r}({p.b}) <small>4s:{p.fours} 6s:{p.sixes}</small></span>
                </div>
             ))}
             <div style={s.divider}></div>
             <div style={s.pRow} onClick={() => isAdmin && setSelModal('bwr')}>
                <span style={{color:'#60a5fa'}}>{match.bwr} (B) {isAdmin && <FaSyncAlt size={10}/>}</span>
                <span>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
             </div>
          </div>

          {isAdmin && (
            <div style={s.adminPanel}>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                <button onClick={()=>handleScore(0, 'wd')} style={s.exBtn}>WD</button>
                <button onClick={()=>handleScore(2, 'wd')} style={s.exBtn}>WD+2</button>
                <button onClick={()=>handleScore(3, 'wd')} style={s.exBtn}>WD+3</button>
                <button onClick={()=>handleScore(0, 'nb')} style={s.nbBtn}>NB</button>
                <button onClick={()=>handleScore(2, 'nb')} style={s.nbBtn}>NB+2</button>
                <button onClick={()=>handleScore(3, 'nb')} style={s.nbBtn}>NB+3</button>
                <button onClick={()=>handleScore(0,'normal', true)} style={s.wktBtn}>OUT</button>
                <button onClick={() => setIsAdmin(false)} style={s.numBtn}>EXIT</button>
              </div>
              <div style={s.flexGap}>
                <button onClick={() => update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1})} style={s.saveBtn}><FaPlay/> Start 2nd Innings</button>
                <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}><FaTrash/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAdmin && selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}><div style={s.modal} onClick={e => e.stopPropagation()}>
          <h3>Select New Player</h3>
          {(selModal === 'bwr' ? match.t2p : match.t1p).map((p, i) => (
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
  pinInput: { padding:'12px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'8px', width:'80%', textAlign:'center', marginTop:'15px' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'50px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  flexGap: { display:'flex', gap:'10px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #334155' },
  mainScore: { fontSize:'55px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'18px', opacity:0.8 },
  targetBox: { background:'#facc15', color:'black', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold', marginTop:'10px', display:'inline-block' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', opacity:0.7 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'8px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#334155', margin:'10px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', paddingBottom:'10px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  nbBtn: { padding:'15px', background:'#8b5cf6', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  saveBtn: { flex:3, padding:'15px', background:'#22c55e', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  delBtn: { flex:1, padding:'15px', background:'#b91c1c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:1000 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'20px', textAlign:'center' },
  pItem: { padding:'12px', borderBottom:'1px solid #334155' }
};
