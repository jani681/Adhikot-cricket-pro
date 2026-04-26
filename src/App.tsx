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

export default function AdhikotProFinal() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selModal, setSelModal] = useState(null); 
  const [anim, setAnim] = useState("");

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => setMatch(snap.val()));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  // WhatsApp Status Share Logic
  const shareStatus = (playerNo = "") => {
    if (!match) return;
    const text = `🏏 *Adhikot Live Match Update* \n🏆 ${match.lg}\n📊 Score: ${match.score}/${match.wkts}\novers: ${match.ov}.${match.bl}/${match.maxOv}\n🎯 Target: ${match.target || 'N/A'}\n⚡ RR: ${(match.score/(match.ov+(match.bl/6)) || 0).toFixed(2)}`;
    const url = `https://wa.me/${playerNo}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
    } else if (type === 'wd' || type === 'nb') { score += 1; bwr_r += 1; triggerAnim(type === 'wd' ? "WIDE" : "NO BALL"); }

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
    const [name, phone] = pData.split('-');
    if (type === 's1') update(ref(db, 'liveMatch'), { 's1/n': name, 's1/ph': phone || "", 's1/r': 0, 's1/b': 0, active: 1 });
    if (type === 's2') update(ref(db, 'liveMatch'), { 's2/n': name, 's2/ph': phone || "", 's2/r': 0, 's2/b': 0, active: 2 });
    if (type === 'bwr') update(ref(db, 'liveMatch'), { bwr: name, bwr_ph: phone || "", bwr_r: 0, bwr_w: 0, bwr_o: 0 });
    setSelModal(null);
  };

  if (!isAdmin && !match) {
    return (
      <div style={s.container}>
        <div style={s.authBox}>
          <FaUserShield size={60} color="#facc15" />
          <h2 style={{color:'white', margin:'20px 0'}}>Admin Panel</h2>
          <input type="password" placeholder="PIN" style={s.pinInput} onChange={(e) => e.target.value === "6545" && setIsAdmin(true)} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}>
        <div style={s.flexBetween}>
           <div style={s.flex}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal Baghoor</b><br/><span style={s.livePulse}><FaCircle size={7}/> LIVE MATCH ACTIVE</span></div>
           </div>
           <FaWhatsapp size={26} color="#22c55e" onClick={() => shareStatus()} style={{cursor:'pointer'}}/>
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
            <input name="toss" placeholder="Toss Result (e.g. Chan won toss)" style={s.input} />
            <div style={s.flexGap}><input name="t1" placeholder="Batting Team" style={s.input}/><input name="t2" placeholder="Bowling Team" style={s.input}/></div>
            <textarea name="t1p" placeholder="Batting Squad (Name-Number, ...)" style={s.area}/>
            <textarea name="t2p" placeholder="Bowling Squad (Name-Number, ...)" style={s.area}/>
            <div style={s.flexGap}><input name="date" type="date" style={s.input}/><input name="time" type="time" style={s.input}/></div>
            <input name="max" placeholder="Overs" type="number" style={s.input}/>
            <button type="submit" style={s.goldBtn}>START LIVE</button>
          </form>
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'12px', opacity:0.6}}><FaClock size={10}/> {match.date} | {match.time} | {match.toss}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.rrBox}>RR: {(match.score/(match.ov+(match.bl/6)) || 0).toFixed(2)}</div>
            {match.target > 0 && <div style={s.targetBox}>TARGET: {match.target}</div>}
            {match.result && <div style={s.resultBox}>{match.result}</div>}
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow}>
                   <div style={s.flex} onClick={() => setSelModal(i === 0 ? 's1' : 's2')}>
                      <span>{p?.n}{match.active === (i+1) ? '*' : ''}</span>
                      <FaSyncAlt size={10} style={{opacity:0.4}}/>
                   </div>
                   <div style={s.flex}>
                      <span style={{marginRight:'10px'}}>{p?.r}({p?.b})</span>
                      <FaWhatsapp color="#22c55e" onClick={() => shareStatus(p?.ph)}/>
                   </div>
                </div>
             ))}
             <div style={s.divider}></div>
             <div style={s.pRow}>
                <div style={s.flex} onClick={() => setSelModal('bwr')}>
                   <span style={{color:'#60a5fa'}}>{match.bwr}</span>
                   <FaSyncAlt size={10} style={{opacity:0.4}}/>
                </div>
                <div style={s.flex}>
                   <span style={{marginRight:'10px'}}>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
                   <FaWhatsapp color="#22c55e" onClick={() => shareStatus(match.bwr_ph)}/>
                </div>
             </div>
          </div>

          {isAdmin && (
            <>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                <button onClick={()=>handleScore(0,'wd')} style={s.exBtn}>WD</button>
                <button onClick={()=>handleScore(0,'nb')} style={s.exBtn}>NB</button>
                <button onClick={()=>handleScore(0,'wkt')} style={s.wktBtn}>WKT</button>
              </div>
              <div style={s.flexGap}>
                <button onClick={() => update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1})} style={s.saveBtn}>Start 2nd Innings</button>
                <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}><FaTrash/> Delete</button>
              </div>
            </>
          )}
        </div>
      )}

      {selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3>Select {selModal === 'bwr' ? 'Bowler' : 'Player'}</h3>
              {(selModal === 'bwr' ? match.t2p : match.t1p).map((p, i) => (
                <div key={i} style={s.pItem} onClick={() => manualSelect(selModal, p)}>
                  <span>{p.split('-')[0]}</span>
                  <FaWhatsapp size={18} color="#22c55e" />
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
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', width:'70%', textAlign:'center' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'2px solid #facc15' },
  flex: { display:'flex', alignItems:'center', gap:'8px' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  livePulse: { color:'#ef4444', fontSize:'10px', fontWeight:'bold' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'12px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  flexGap: { display:'flex', gap:'10px', marginBottom:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', border:'1px solid #1e293b', margin:'10px' },
  mainScore: { fontSize:'55px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'18px', opacity:0.8 },
  rrBox: { marginTop:'8px', color:'#facc15', background:'rgba(250,204,21,0.1)', padding:'4px 12px', borderRadius:'20px', display:'inline-block', fontSize:'13px' },
  targetBox: { color:'#facc15', fontWeight:'bold', fontSize:'22px', marginTop:'10px' },
  resultBox: { background:'#22c55e', padding:'10px', borderRadius:'10px', marginTop:'15px', fontWeight:'bold' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'12px 0', opacity:0.8 },
  activeP: { display:'flex', justifyContent:'space-between', padding:'12px 0', color:'#facc15', fontWeight:'bold' },
  divider: { height:'1px', background:'#334155', margin:'5px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', padding:'10px' },
  numBtn: { padding:'18px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'18px', background:'#facc15', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'18px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  saveBtn: { flex:2, padding:'15px', background:'#22c55e', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  delBtn: { flex:1, padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:1000 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'20px', maxHeight:'60vh', overflowY:'auto' },
  pItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #334155' }
};
