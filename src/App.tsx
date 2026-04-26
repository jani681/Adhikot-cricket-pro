import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaCircle, FaUserShield, FaClock, FaTrophy, FaTrash } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProStable() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selModal, setSelModal] = useState(null); 

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsub = onValue(matchRef, (snap) => {
      if (snap.exists()) setMatch(snap.val());
      else setMatch(null);
    });
    return () => unsub();
  }, []);

  const shareStatus = (playerNo = "923015800630") => {
    if (!match) return;
    const text = `🏏 *Live Match Update* \n📊 Score: ${match.score}/${match.wkts}\nOvers: ${match.ov}.${match.bl}/${match.maxOv}\n🎯 Target: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/${playerNo}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleScore = (runs, type = 'normal') => {
    if (!match || match.status === 'Finished') return;
    let data = { ...match };

    if (type === 'wkt') {
        data.wkts += 1; data.bwr_w += 1; data.bl += 1;
        data.active === 1 ? (data.s1.r = "OUT") : (data.s2.r = "OUT");
    } else if (type === 'normal') {
        data.score += runs; data.bwr_r += runs; data.bl += 1;
        if (data.active === 1) { data.s1.r = (parseInt(data.s1.r) || 0) + runs; data.s1.b += 1; } 
        else { data.s2.r = (parseInt(data.s2.r) || 0) + runs; data.s2.b += 1; }
        if (runs === 1 || runs === 3) data.active = data.active === 1 ? 2 : 1;
    } else if (type === 'wd' || type === 'nb') { data.score += 1; data.bwr_r += 1; }

    if (data.bl === 6) { data.ov += 1; data.bl = 0; data.bwr_o += 1; data.active = data.active === 1 ? 2 : 1; }

    if (data.innings === 1 && (data.ov >= data.maxOv || data.wkts >= 10)) { data.status = 'Innings Break'; data.target = data.score + 1; }
    else if (data.innings === 2) {
        if (data.score >= data.target) { data.status = 'Finished'; data.result = `${data.t2} WON!`; }
        else if (data.ov >= data.maxOv || data.wkts >= 10) { data.status = 'Finished'; data.result = `${data.t1} WON!`; }
    }
    update(ref(db, 'liveMatch'), data);
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
             <div><b>Touqeer Iqbal Baghoor</b><br/><small style={{color:'#ef4444'}}>● LIVE</small></div>
           </div>
           <FaWhatsapp size={24} color="#22c55e" onClick={() => shareStatus()}/>
        </div>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15'}}><FaTrophy/> New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), toss: fd.get('toss'), t1: fd.get('t1'), t2: fd.get('t2'), 
              date: fd.get('date'), time: fd.get('time'),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              s1: {n: 'Striker', r: 0, b: 0, ph:''}, s2: {n: 'Non-Striker', r: 0, b: 0, ph:''}, active: 1,
              bwr: 'Bowler', bwr_ph:'', bwr_r: 0, bwr_w: 0, bwr_o: 0,
              score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', target: 0, maxOv: parseInt(fd.get('max'))
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="toss" placeholder="Toss Detail" style={s.input} />
            <div style={s.flexGap}><input name="t1" placeholder="Batting Team" style={s.input}/><input name="t2" placeholder="Bowling Team" style={s.input}/></div>
            <textarea name="t1p" placeholder="Team A Squad (Name-Number, ...)" style={s.area}/>
            <textarea name="t2p" placeholder="Team B Squad (Name-Number, ...)" style={s.area}/>
            <div style={s.flexGap}><input name="date" type="date" style={s.input}/><input name="time" type="time" style={s.input}/></div>
            <input name="max" placeholder="Overs" type="number" style={s.input}/>
            <button type="submit" style={s.goldBtn}>START MATCH</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <small style={{opacity:0.6}}>{match.date} | {match.time} | {match.toss}</small>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>TARGET: {match.target}</div>}
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow} onClick={() => setSelModal(i === 0 ? 's1' : 's2')}>
                   <span>{p?.n}{match.active === (i+1) ? '*' : ''} <FaSyncAlt size={10}/></span>
                   <span>{p?.r}({p?.b})</span>
                </div>
             ))}
             <div style={s.divider}></div>
             <div style={s.pRow} onClick={() => setSelModal('bwr')}>
                <span style={{color:'#60a5fa'}}>{match.bwr} <FaSyncAlt size={10}/></span>
                <span>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
             </div>
          </div>

          {isAdmin && (
            <div style={{marginTop:'10px'}}>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                <button onClick={()=>handleScore(0,'wd')} style={s.exBtn}>WD</button>
                <button onClick={()=>handleScore(0,'nb')} style={s.exBtn}>NB</button>
                <button onClick={()=>handleScore(0,'wkt')} style={s.wktBtn}>WKT</button>
              </div>
              <div style={s.flexGap}>
                <button onClick={() => update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1})} style={s.saveBtn}>Start 2nd Innings</button>
                <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}><FaTrash/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3>Select {selModal === 'bwr' ? 'Bowler' : 'Player'}</h3>
              {(selModal === 'bwr' ? match.t2p : match.t1p).map((p, i) => (
                <div key={i} style={s.pItem} onClick={() => {
                    const [n, ph] = p.split('-');
                    const up = {};
                    if(selModal==='s1') { up['s1/n']=n; up['s1/ph']=ph||''; up['s1/r']=0; up['s1/b']=0; up.active=1; }
                    if(selModal==='s2') { up['s2/n']=n; up['s2/ph']=ph||''; up['s2/r']=0; up['s2/b']=0; up.active=2; }
                    if(selModal==='bwr') { up.bwr=n; up.bwr_ph=ph||''; up.bwr_r=0; up.bwr_w=0; up.bwr_o=0; }
                    update(ref(db, 'liveMatch'), up);
                    setSelModal(null);
                }}>
                  <span>{p.split('-')[0]}</span>
                  <FaWhatsapp size={16} color="#22c55e" />
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
  authBox: { textAlign:'center', paddingTop:'150px' },
  pinInput: { padding:'12px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'8px', width:'60%', textAlign:'center' },
  header: { background:'#0f172a', padding:'12px', borderBottom:'1px solid #334155' },
  flex: { display:'flex', alignItems:'center', gap:'8px' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  avatar: { width:'32px', height:'32px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'15px', background:'#0f172a', margin:'10px', borderRadius:'12px' },
  input: { width:'100%', padding:'10px', marginBottom:'8px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'6px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'50px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'6px', marginBottom:'8px' },
  flexGap: { display:'flex', gap:'8px', marginBottom:'8px' },
  goldBtn: { width:'100%', padding:'12px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'6px' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'15px', textAlign:'center', margin:'10px', border:'1px solid #1e293b' },
  mainScore: { fontSize:'50px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'16px', opacity:0.7 },
  targetBox: { color:'#facc15', fontWeight:'bold', fontSize:'20px', marginTop:'5px' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'12px', borderRadius:'12px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'10px 0', opacity:0.8 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'10px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#334155', margin:'5px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'8px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#facc15', color:'black', borderRadius:'8px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'8px', fontWeight:'bold', border:'none' },
  saveBtn: { flex:3, padding:'12px', background:'#22c55e', color:'white', borderRadius:'8px', fontWeight:'bold', border:'none' },
  delBtn: { flex:1, padding:'12px', background:'#ef4444', color:'white', borderRadius:'8px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal: { background:'#1e293b', width:'85%', padding:'15px', borderRadius:'15px', maxHeight:'60vh', overflowY:'auto' },
  pItem: { display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #334155' }
};
