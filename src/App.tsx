import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaLock, FaCalendarAlt, FaSyncAlt, FaCircle, FaUserShield } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProMaster() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selModal, setSelModal] = useState(null); 
  const [anim, setAnim] = useState("");

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal') => {
    if (!match || match.status === 'Finished') return;
    let { score, wkts, bl, ov, maxOv, target, innings, s1, s2, active, bwr_r, bwr_w, bwr_o } = { ...match };

    if (type === 'wkt') {
        wkts += 1; bwr_w += 1; bl += 1;
        active === 1 ? s1.r = "OUT" : s2.r = "OUT";
        triggerAnim("OUT! ☝️");
    } else if (type === 'normal') {
        score += runs; bwr_r += runs; bl += 1;
        active === 1 ? (s1.r += runs, s1.b += 1) : (s2.r += runs, s2.b += 1);
        if (runs === 4) triggerAnim("FOUR! ✨");
        if (runs === 6) triggerAnim("SIXER! 🚀");
        if (runs === 1 || runs === 3) active = active === 1 ? 2 : 1;
    } else if (type === 'wd' || type === 'nb') {
        score += 1; bwr_r += 1;
    }

    if (bl === 6) { ov += 1; bl = 0; bwr_o += 1; active = active === 1 ? 2 : 1; triggerAnim("OVER! 🔄"); }

    let status = 'Live';
    let result = '';
    if (innings === 1 && (ov >= maxOv || wkts >= 10)) { status = 'Innings Break'; target = score + 1; }
    else if (innings === 2) {
        if (score >= target) { status = 'Finished'; result = `${match.t2} WON! 🏆`; }
        else if (ov >= maxOv || wkts >= 10) { status = 'Finished'; result = `${match.t1} WON! 🏆`; }
    }

    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, status, target, result, s1, s2, active, bwr_r, bwr_w, bwr_o });
  };

  const manualSelect = (type, pData) => {
    const [name, phone] = pData.split('-');
    if (type === 's1') update(ref(db, 'liveMatch'), { 's1/n': name, 's1/ph': phone || '', 's1/r': 0, 's1/b': 0, active: 1 });
    if (type === 's2') update(ref(db, 'liveMatch'), { 's2/n': name, 's2/ph': phone || '', 's2/r': 0, 's2/b': 0, active: 2 });
    if (type === 'bwr') update(ref(db, 'liveMatch'), { bwr: name, bwr_ph: phone || '', bwr_r: 0, bwr_w: 0, bwr_o: 0 });
    setSelModal(null);
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <FaUserShield size={50} color="#facc15" />
          <h2 style={{color:'white', margin:'20px 0'}}>Adhikot Pro Admin</h2>
          <input type="password" placeholder="PIN" style={s.pinInput} onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
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
           <div style={{flex:1}}><b>Touqeer Iqbal</b><br/><span style={s.livePulse}><FaCircle size={8}/> LIVE</span></div>
           <a href="https://wa.me/923015800630" style={{color:'#22c55e'}}><FaWhatsapp size={22}/></a>
        </div>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3><FaCalendarAlt color="#facc15"/> Setup Match</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), toss: fd.get('toss'),
              t1: fd.get('t1'), t2: fd.get('t2'), date: fd.get('date'),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              s1: {n: 'Select Striker', r: 0, b: 0}, s2: {n: 'Select Non-Striker', r: 0, b: 0}, active: 1,
              bwr: 'Select Bowler', bwr_r: 0, bwr_w: 0, bwr_o: 0,
              score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', target: 0, maxOv: parseInt(fd.get('max'))
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="toss" placeholder="Toss Result (e.g Team A won & Bat)" style={s.input} />
            <div style={s.flexGap}><input name="t1" placeholder="Batting Team" style={s.input}/><input name="t2" placeholder="Bowling Team" style={s.input}/></div>
            <textarea name="t1p" placeholder="Batting Squad (Name-Number, Name-Number...)" style={s.area}/>
            <textarea name="t2p" placeholder="Bowling Squad (Name-Number, Name-Number...)" style={s.area}/>
            <div style={s.flexGap}><input name="date" type="date" style={s.input}/><input name="max" placeholder="Overs" type="number" style={s.input}/></div>
            <button type="submit" style={s.goldBtn}>START MATCH</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'11px', opacity:0.7}}>{match.toss} | {match.gr}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.rrTag}>RR: {(match.score / (match.ov + match.bl/6) || 0).toFixed(2)}</div>
            {match.target > 0 && <div style={s.targetBox}>TARGET: {match.target}</div>}
            {match.result && <div style={s.resultBox}>{match.result}</div>}
          </div>

          <div style={s.pCard}>
             <div style={match.active === 1 ? s.activeP : s.pRow} onClick={() => setSelModal('s1')}>
                <div style={s.flex}>
                    <span>{match.s1.n}*</span>
                    {match.s1.ph && <a href={`https://wa.me/${match.s1.ph}`}><FaWhatsapp color="#22c55e" size={14}/></a>}
                    <FaSyncAlt size={10} style={{opacity:0.5}}/>
                </div>
                <span>{match.s1.r}({match.s1.b})</span>
             </div>
             <div style={match.active === 2 ? s.activeP : s.pRow} onClick={() => setSelModal('s2')}>
                <div style={s.flex}>
                    <span>{match.s2.n}</span>
                    {match.s2.ph && <a href={`https://wa.me/${match.s2.ph}`}><FaWhatsapp color="#22c55e" size={14}/></a>}
                    <FaSyncAlt size={10} style={{opacity:0.5}}/>
                </div>
                <span>{match.s2.r}({match.s2.b})</span>
             </div>
             <div style={s.divider}></div>
             <div style={s.pRow} onClick={() => setSelModal('bwr')}>
                <div style={s.flex}>
                    <span style={{color:'#60a5fa'}}>{match.bwr}</span>
                    {match.bwr_ph && <a href={`https://wa.me/${match.bwr_ph}`}><FaWhatsapp color="#22c55e" size={14}/></a>}
                    <FaSyncAlt size={10} style={{opacity:0.5}}/>
                </div>
                <span>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
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

          <button onClick={() => {
              if(match.innings === 1) update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1});
              else remove(ref(db, 'liveMatch'));
          }} style={s.saveBtn}>{match.innings === 1 ? "Start 2nd Innings" : "Finish & New Match"}</button>
        </div>
      )}

      {selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3>Select {selModal === 'bwr' ? 'Bowler' : 'Batsman'}</h3>
              {(selModal === 'bwr' ? match.t2p : match.t1p).map(p => (
                <div key={p} style={s.dirItem} onClick={() => manualSelect(selModal, p)}>
                  <span>{p.split('-')[0]}</span>
                  <FaWhatsapp size={20} color="#22c55e" />
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
  authBox: { textAlign:'center', marginTop:'150px', padding:'20px' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', width:'70%' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'2px solid #facc15' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  livePulse: { color:'#ef4444', fontSize:'10px', fontWeight:'bold', animation:'pulse 1.5s infinite' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'linear-gradient(180deg, #1e293b, #020617)', padding:'25px', borderRadius:'20px', textAlign:'center', border:'1px solid #334155', margin:'10px' },
  mainScore: { fontSize:'65px', fontWeight:'bold', color:'#facc15', lineHeight:1 },
  rrTag: { background:'#0f172a', display:'inline-block', padding:'4px 12px', borderRadius:'15px', fontSize:'12px', color:'#facc15', marginTop:'8px' },
  targetBox: { color:'#facc15', fontWeight:'bold', fontSize:'20px', marginTop:'10px' },
  resultBox: { padding:'10px', background:'#22c55e', borderRadius:'10px', fontWeight:'bold', marginTop:'12px' },
  pCard: { background:'#0f172a', margin:'15px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'12px 0', opacity:0.8 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'12px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#1e293b', margin:'5px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', padding:'10px' },
  numBtn: { padding:'20px', background:'white', color:'black', borderRadius:'12px', fontWeight:'bold', fontSize:'22px', border:'none' },
  exBtn: { padding:'20px', background:'#facc15', color:'black', borderRadius:'12px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'20px', background:'#ef4444', color:'white', borderRadius:'12px', fontWeight:'bold', border:'none' },
  saveBtn: { width:'95%', padding:'15px', background:'#22c55e', color:'white', borderRadius:'12px', fontWeight:'bold', margin:'10px auto', display:'block', border:'none' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translate(-50%, -50%)', background:'rgba(250, 204, 21, 0.95)', color:'black', padding:'30px', borderRadius:'50px', fontSize:'28px', fontWeight:'bold', zIndex:5000, boxShadow:'0 0 20px #facc15' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:6000 },
  modal: { background:'#0f172a', padding:'25px', borderRadius:'20px', width:'85%', maxHeight:'70vh', overflowY:'auto' },
  dirItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #1e293b' }
};
