import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaTrophy, FaCog, FaHistory, FaEdit, FaPaperPlane, FaBullhorn, FaFilePdf, FaListAlt, FaTimes } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProProfessional() {
  const [match, setMatch] = useState(null);
  const [promo, setPromo] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showFullCard, setShowFullCard] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);
  const [anim, setAnim] = useState("");
  const [commInput, setCommInput] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'appSettings/promo'), (snap) => setPromo(snap.val() || {}));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status !== 'Live' || !isAdmin) return;
    let data = JSON.parse(JSON.stringify(match));
    let striker = data.active === 1 ? data.s1 : data.s2;
    let bName = data.bwr || 'Bowler';
    
    // Initialize Stats Arrays if not exist
    if(!data.stats) data.stats = { inn1: { bat: [], bowl: {} }, inn2: { bat: [], bowl: {} } };
    let curStats = data.innings === 1 ? data.stats.inn1 : data.stats.inn2;
    if(!curStats.bowl[bName]) curStats.bowl[bName] = { r:0, w:0, o:0, b:0 };

    if (type === 'normal') {
      data.score += runs; striker.r += runs; striker.b += 1; data.bl += 1;
      curStats.bowl[bName].r += runs; curStats.bowl[bName].b += 1;
      if (runs === 4) striker.fours += 1;
      if (runs === 6) striker.sixes += 1;
    } else if (type === 'wd') {
      data.score += (1 + runs); curStats.bowl[bName].r += (1 + runs);
    } else if (type === 'nb') {
      data.score += (1 + runs); curStats.bowl[bName].r += (1 + runs);
      striker.r += runs; striker.b += 1;
    }

    if (outType) {
      data.wkts += 1;
      if (outType !== 'Run Out') curStats.bowl[bName].w += 1;
      // Save to batting list
      curStats.bat.push({ n: striker.n, r: striker.r, b: striker.b, f: striker.fours, s: striker.sixes, out: outType });
      triggerAnim("WICKET! ☝️");
      if (data.wkts < 10) setTimeout(() => setSelModal(data.active === 1 ? 's1' : 's2'), 500);
    }

    if (runs % 2 !== 0 && type !== 'wd') data.active = data.active === 1 ? 2 : 1;

    if (data.bl === 6) {
      data.ov += 1; data.bl = 0;
      curStats.bowl[bName].o += 1; curStats.bowl[bName].b = 0;
      data.active = data.active === 1 ? 2 : 1;
      if (data.ov < data.maxOv && data.wkts < 10) setTimeout(() => setSelModal('bwr'), 600);
    }

    // Innings/Match Finish Logic
    if (data.innings === 2 && data.score >= data.target) {
      data.status = 'Finished'; data.winner = data.batTeam;
    } else if (data.ov >= data.maxOv || data.wkts >= 10) {
      data.status = data.innings === 1 ? 'Innings Break' : 'Finished';
      if(data.status === 'Finished' && data.innings === 2) {
         data.winner = data.score < data.target - 1 ? data.bowlTeam : (data.score === data.target-1 ? 'Tie' : data.batTeam);
      }
    }

    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };

  const startSecondInnings = () => {
    let data = JSON.parse(JSON.stringify(match));
    // Save not out batsmen of Innings 1
    data.stats.inn1.bat.push({...data.s1, out: 'Not Out'}, {...data.s2, out: 'Not Out'});
    
    update(ref(db, 'liveMatch'), {
      ...data, innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: data.score + 1,
      status: 'Live', batTeam: data.bowlTeam, bowlTeam: data.batTeam,
      s1: {n: 'Striker', r: 0, b: 0, fours: 0, sixes: 0}, 
      s2: {n: 'Non-Striker', r: 0, b: 0, fours: 0, sixes: 0},
      bwr: 'New Bowler'
    });
  };

  const generatePDF = () => {
    const win = window.open('', '_blank');
    const content = document.getElementById('full-scorecard-content').innerHTML;
    win.document.write(`<html><head><title>Scorecard</title><style>body{font-family:sans-serif;padding:20px} table{width:100%;border-collapse:collapse;margin-bottom:20px} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f2f2f2}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* Main Structure Safe */}
      <div style={s.header}><div style={s.flexBetween}>
           <div style={s.flex} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small style={{color:'#facc15'}}>PRO SCORER</small></div>
           </div>
           <FaListAlt size={22} color="#facc15" onClick={() => setShowFullCard(true)} />
      </div></div>

      {match && (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>Target: {match.target}</div>}
            <button onClick={() => setShowFullCard(true)} style={s.viewFullBtn}>MUKAMMAL SCOREBOARD</button>
          </div>

          {/* Controls */}
          {isAdmin && match.status === 'Live' && (
            <div style={s.adminGrid}>
               {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
               <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD</button>
               <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
               <button onClick={() => setShowPromoModal(true)} style={{gridColumn:'span 3', ...s.promoBtn}}><FaBullhorn/> MANAGE ADS</button>
            </div>
          )}
          {isAdmin && match.status === 'Innings Break' && (
             <button onClick={startSecondInnings} style={s.saveBtn}>START 2ND INNINGS (+1 TARGET)</button>
          )}
        </div>
      )}

      {/* FULL PROFESSIONAL SCOREBOARD MODAL */}
      {showFullCard && match && (
        <div style={s.overlay} onClick={() => setShowFullCard(false)}>
          <div style={s.modalFull} onClick={e => e.stopPropagation()}>
            <div id="full-scorecard-content">
                <center><h2>{match.t1} vs {match.t2}</h2><p>{match.lg} Scorecard</p></center>
                
                {/* Innings 1 Table */}
                <h3 style={s.innTitle}>INNINGS 1: {match.innings === 1 ? match.batTeam : match.bowlTeam}</h3>
                <table style={s.table}>
                  <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr></thead>
                  <tbody>
                    {match.stats?.inn1.bat.map((b,i)=>(<tr key={i}><td>{b.n}<br/><small>{b.out}</small></td><td>{b.r}</td><td>{b.b}</td><td>{b.f}</td><td>{b.s}</td></tr>))}
                  </tbody>
                </table>
                <table style={s.table}>
                  <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th></tr></thead>
                  <tbody>
                    {Object.entries(match.stats?.inn1.bowl || {}).map(([n,st],i)=>(<tr key={i}><td>{n}</td><td>{st.o}.{st.b}</td><td>{st.r}</td><td>{st.w}</td><td>{(st.r/(st.o||1)).toFixed(1)}</td></tr>))}
                  </tbody>
                </table>

                {/* Innings 2 Table */}
                {(match.innings === 2 || match.status === 'Finished') && (
                  <>
                    <h3 style={s.innTitle}>INNINGS 2: {match.innings === 2 ? match.batTeam : match.bowlTeam}</h3>
                    <table style={s.table}>
                        <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr></thead>
                        <tbody>
                        {match.stats?.inn2.bat.map((b,i)=>(<tr key={i}><td>{b.n}<br/><small>{b.out}</small></td><td>{b.r}</td><td>{b.b}</td><td>{b.f}</td><td>{b.s}</td></tr>))}
                        {match.innings === 2 && <>
                            <tr><td>{match.s1.n}*</td><td>{match.s1.r}</td><td>{match.s1.b}</td><td>{match.s1.fours}</td><td>{match.s1.sixes}</td></tr>
                            <tr><td>{match.s2.n}*</td><td>{match.s2.r}</td><td>{match.s2.b}</td><td>{match.s2.fours}</td><td>{match.s2.sixes}</td></tr>
                        </>}
                        </tbody>
                    </table>
                  </>
                )}
            </div>
            <div style={s.flexGap}>
                <button onClick={generatePDF} style={s.goldBtn}><FaFilePdf/> PDF DOWNLOAD</button>
                <button onClick={() => setShowFullCard(false)} style={s.delBtn}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth for Pin 6545 */}
      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <input type="password" placeholder="PIN" style={s.pinInput} autoFocus onChange={(e) => { if(e.target.value === "6545") { setIsAdmin(true); setShowAuth(false); }}} />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #334155' },
  flexBetween: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  card: { background:'#0f172a', padding:'25px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #1e293b' },
  mainScore: { fontSize:'60px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'18px', opacity:0.8 },
  targetBox: { background:'#facc15', color:'black', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold', marginTop:'10px', display:'inline-block' },
  viewFullBtn: { marginTop:'20px', padding:'12px', background:'rgba(250,204,21,0.1)', color:'#facc15', border:'1px solid #facc15', borderRadius:'10px', width:'100%', fontWeight:'bold' },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'15px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  promoBtn: { padding:'15px', background:'#a855f7', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  saveBtn: { width:'95%', margin:'10px auto', display:'block', padding:'15px', background:'#22c55e', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', padding:'20px', borderRadius:'20px', width:'80%' },
  modalFull: { background:'#fff', color:'#000', padding:'20px', borderRadius:'15px', width:'95%', maxHeight:'90vh', overflowY:'auto' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', width:'100%', boxSizing:'border-box' },
  innTitle: { background:'#020617', color:'#facc15', padding:'10px', borderRadius:'5px' },
  table: { width:'100%', borderCollapse:'collapse', marginBottom:'20px', fontSize:'13px' },
  flexGap: { display:'flex', gap:'10px', marginTop:'20px' },
  goldBtn: { flex:1, padding:'12px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  delBtn: { flex:1, padding:'12px', background:'#ef4444', color:'white', fontWeight:'bold', border:'none', borderRadius:'8px' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:6000 }
};
