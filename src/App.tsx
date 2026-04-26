import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaCircle, FaUserShield, FaCalendarAlt, FaTrophy } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProMasterFixed() {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to prevent blank screen
  const [isAdmin, setIsAdmin] = useState(false);
  const [selModal, setSelModal] = useState(null); 
  const [anim, setAnim] = useState("");

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsubscribe = onValue(matchRef, (snap) => {
      setMatch(snap.val());
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal') => {
    if (!match || match.status === 'Finished') return;
    let { score, wkts, bl, ov, maxOv, target, innings, s1, s2, active, bwr_r, bwr_w, bwr_o } = { ...match };

    if (type === 'wkt') {
        wkts += 1; bwr_w += 1; bl += 1;
        active === 1 ? (s1.r = "OUT") : (s2.r = "OUT");
        triggerAnim("OUT! ☝️");
    } else if (type === 'normal') {
        score += runs; bwr_r += runs; bl += 1;
        if (active === 1) { s1.r = (parseInt(s1.r) || 0) + runs; s1.b += 1; } 
        else { s2.r = (parseInt(s2.r) || 0) + runs; s2.b += 1; }
        if (runs === 4) triggerAnim("FOUR! ✨");
        if (runs === 6) triggerAnim("SIXER! 🚀");
        if (runs === 1 || runs === 3) active = active === 1 ? 2 : 1;
    } else if (type === 'wd' || type === 'nb') {
        score += 1; bwr_r += 1;
        triggerAnim(type === 'wd' ? "WIDE" : "NO BALL");
    }

    if (bl === 6) { ov += 1; bl = 0; bwr_o += 1; active = active === 1 ? 2 : 1; triggerAnim("OVER! 🔄"); }

    let status = 'Live';
    let result = match.result || '';
    if (innings === 1 && (ov >= maxOv || wkts >= 10)) { status = 'Innings Break'; target = score + 1; }
    else if (innings === 2) {
        if (score >= target) { status = 'Finished'; result = `${match.t2} WON! 🏆`; }
        else if (ov >= maxOv || wkts >= 10) { status = 'Finished'; result = `${match.t1} WON! 🏆`; }
    }

    update(ref(db, 'liveMatch'), { score, wkts, bl, ov, status, target, result, s1, s2, active, bwr_r, bwr_w, bwr_o });
  };

  const manualSelect = (type, pData) => {
    const pArray = pData.split('-');
    const name = pArray[0].trim();
    const phone = pArray[1] ? pArray[1].trim() : "";
    
    if (type === 's1') update(ref(db, 'liveMatch'), { 's1/n': name, 's1/ph': phone, 's1/r': 0, 's1/b': 0, active: 1 });
    if (type === 's2') update(ref(db, 'liveMatch'), { 's2/n': name, 's2/ph': phone, 's2/r': 0, 's2/b': 0, active: 2 });
    if (type === 'bwr') update(ref(db, 'liveMatch'), { bwr: name, bwr_ph: phone, bwr_r: 0, bwr_w: 0, bwr_o: 0 });
    setSelModal(null);
  };

  if (loading) return <div style={s.loader}>Adhikot Pro Loading...</div>;

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <FaUserShield size={60} color="#facc15" />
          <h2 style={{color:'white', margin:'20px 0'}}>Admin Login</h2>
          <input type="password" placeholder="Enter PIN (6545)" style={s.pinInput} onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
        </div>
      </div>
    );
  }

  const currentRR = match ? (match.score / (match.ov + (match.bl / 6)) || 0).toFixed(2) : "0.00";

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}>
        <div style={s.flexBetween}>
           <div style={s.flex}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><span style={s.livePulse}><FaCircle size={7}/> LIVE</span></div>
           </div>
           <a href="https://wa.me/923015800630" target="_blank" rel="noreferrer" style={{color:'#22c55e'}}><FaWhatsapp size={26}/></a>
        </div>
      </div>

      {!match ? (
        <div style={s.setupBox}>
          <h3 style={{color:'#facc15'}}><FaTrophy/> New Match Setup</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            set(ref(db, 'liveMatch'), {
              lg: fd.get('lg'), gr: fd.get('gr'), toss: fd.get('toss'),
              t1: fd.get('t1'), t2: fd.get('t2'), date: fd.get('date'),
              t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
              s1: {n: 'Select Striker', r: 0, b: 0, ph:''}, s2: {n: 'Select Non-Striker', r: 0, b: 0, ph:''}, active: 1,
              bwr: 'Select Bowler', bwr_ph:'', bwr_r: 0, bwr_w: 0, bwr_o: 0,
              score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', target: 0, maxOv: parseInt(fd.get('max'))
            });
          }}>
            <input name="lg" placeholder="League Name" style={s.input} required />
            <input name="toss" placeholder="Toss Result" style={s.input} />
            <div style={s.flexGap}><input name="t1" placeholder="Batting Team" style={s.input}/><input name="t2" placeholder="Bowling Team" style={s.input}/></div>
            <textarea name="t1p" placeholder="Batting Squad (Name-Number, Name-Number...)" style={s.area}/>
            <textarea name="t2p" placeholder="Bowling Squad (Name-Number, Name-Number...)" style={s.area}/>
            <div style={s.flexGap}><input name="date" type="date" style={s.input}/><input name="max" placeholder="Overs" type="number" style={s.input}/></div>
            <button type="submit" style={s.goldBtn}>START LIVE</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'12px', opacity:0.6}}>{match.toss || 'Match Started'} | {match.gr}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.rrBox}>Run Rate: {currentRR}</div>
            {match.target > 0 && <div style={s.targetBox}>TARGET: {match.target}</div>}
            {match.result && <div style={s.resultBox}>{match.result}</div>}
          </div>

          <div style={s.playerCard}>
             <div style={match.active === 1 ? s.activeP : s.pRow} onClick={() => setSelModal('s1')}>
                <div style={s.flex}>
                    <span>{match.s1?.n || 'Select'}*</span>
                    {match.s1?.ph && <FaWhatsapp color="#22c55e" size={12}/>}
                    <FaSyncAlt size={10} style={{opacity:0.4}}/>
                </div>
                <span>{match.s1?.r}({match.s1?.b})</span>
             </div>
             <div style={match.active === 2 ? s.activeP : s.pRow} onClick={() => setSelModal('s2')}>
                <div style={s.flex}>
                    <span>{match.s2?.n || 'Select'}</span>
                    {match.s2?.ph && <FaWhatsapp color="#22c55e" size={12}/>}
                    <FaSyncAlt size={10} style={{opacity:0.4}}/>
                </div>
                <span>{match.s2?.r}({match.s2?.b})</span>
             </div>
             <div style={s.divider}></div>
             <div style={s.pRow} onClick={() => setSelModal('bwr')}>
                <div style={s.flex}>
                    <span style={{color:'#60a5fa'}}>{match.bwr || 'Select'}</span>
                    {match.bwr_ph && <FaWhatsapp color="#22c55e" size={12}/>}
                    <FaSyncAlt size={10} style={{opacity:0.4}}/>
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
          }} style={s.saveBtn}>{match.innings === 1 ? "Start 2nd Innings" : "Reset Match"}</button>
        </div>
      )}

      {selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3 style={{marginBottom:'15px'}}>Select {selModal === 'bwr' ? 'Bowler' : 'Batsman'}</h3>
              {(selModal === 'bwr' ? (match.t2p || []) : (match.t1p || [])).map((p, i) => (
                <div key={i} style={s.pItem} onClick={() => manualSelect(selModal, p)}>
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
  loader: { background:'#020617', color:'#facc15', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'bold' },
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  authBox: { textAlign:'center', paddingTop:'150px' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', width:'70%', textAlign:'center' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #334155' },
  flex: { display:'flex', alignItems:'center', gap:'8px' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  livePulse: { color:'#ef4444', fontSize:'9px', fontWeight:'bold' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'#0f172a', padding:'25px', borderRadius:'20px', textAlign:'center', border:'1px solid #1e293b', margin:'10px' },
  mainScore: { fontSize:'60px', fontWeight:'bold', color:'#facc15', margin:'5px 0' },
  overInfo: { fontSize:'18px', opacity:0.8 },
  rrBox: { marginTop:'10px', color:'#facc15', background:'rgba(250,204,21,0.1)', padding:'5px 15px', borderRadius:'20px', fontSize:'14px' },
  targetBox: { color:'#facc15', fontWeight:'bold', fontSize:'22px', marginTop:'15px' },
  resultBox: { background:'#22c55e', padding:'10px', borderRadius:'10px', marginTop:'15px', fontWeight:'bold' },
  playerCard: { background:'#0f172a', margin:'15px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'12px 0', opacity:0.7 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'12px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#1e293b', margin:'5px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', padding:'10px' },
  numBtn: { padding:'20px', background:'white', color:'black', borderRadius:'12px', fontWeight:'bold', fontSize:'20px', border:'none' },
  exBtn: { padding:'20px', background:'#facc15', color:'black', borderRadius:'12px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'20px', background:'#ef4444', color:'white', borderRadius:'12px', fontWeight:'bold', border:'none' },
  saveBtn: { width:'95%', padding:'15px', background:'#22c55e', color:'white', borderRadius:'12px', fontWeight:'bold', margin:'10px auto', display:'block', border:'none' },
  bigAnim: { position:'fixed', top:'30%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'20px 40px', borderRadius:'50px', fontWeight:'bold', zIndex:1000 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'20px', maxHeight:'70vh', overflowY:'auto' },
  pItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #334155' }
};
