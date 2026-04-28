import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog, FaTimes, FaHistory, FaEdit, FaCommentDots, FaPaperPlane, FaGlobe, FaBullhorn, FaFilePdf, FaListAlt } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProUltra() {
  const [match, setMatch] = useState(null);
  const [history, setHistory] = useState({});
  const [promo, setPromo] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showFullCard, setShowFullCard] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);
  const [anim, setAnim] = useState("");
  const [lastState, setLastState] = useState(null); 
  const [commInput, setCommInput] = useState(""); 

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    onValue(matchRef, (snap) => {
      const data = snap.val();
      if (data) {
        setMatch(data);
      } else { setMatch(null); }
    });

    onValue(ref(db, 'matchHistory'), (snap) => setHistory(snap.val() || {}));
    onValue(ref(db, 'appSettings/promo'), (snap) => setPromo(snap.val() || {}));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const postCommentary = (text) => {
    if (!text || !match) return;
    const newComm = [text, ...(match.commentary || [])].slice(0, 5); 
    update(ref(db, 'liveMatch'), { commentary: newComm });
    setCommInput("");
  };

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status !== 'Live' || !isAdmin) return;
    setLastState(JSON.parse(JSON.stringify(match))); 
    let data = { ...match };
    
    let striker = data.active === 1 ? data.s1 : data.s2;
    let bName = data.bwr || 'Unknown Bowler';
    
    if (!data.bowlersDict) data.bowlersDict = {};
    if (!data.bowlersDict[bName]) data.bowlersDict[bName] = { r: 0, w: 0, o: 0, b: 0 };
    let curBwr = data.bowlersDict[bName];

    if (type === 'normal') {
      data.score += runs; 
      curBwr.r += runs;
      striker.r = (parseInt(striker.r) || 0) + runs; 
      striker.b += 1;
      curBwr.b += 1;
      data.bl += 1;
      if (runs === 4) { striker.fours += 1; triggerAnim("FOUR! ✨"); postCommentary(`${striker.n} hits a FOUR!`); }
      else if (runs === 6) { striker.sixes += 1; triggerAnim("SIXER! 🚀"); postCommentary(`${striker.n} hits a SIX!`); }
    } else if (type === 'wd') {
      data.score += (1 + runs); curBwr.r += (1 + runs);
    } else if (type === 'nb') {
      data.score += (1 + runs); curBwr.r += (1 + runs);
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
    }

    if (outType) {
      data.wkts += 1; 
      if (outType !== 'Run Out') curBwr.w += 1;
      if (!data.battingCard) data.battingCard = [];
      data.battingCard.push({ 
        n: striker.n, r: striker.r, b: striker.b, f: striker.fours, s: striker.sixes, out: outType 
      });
      triggerAnim(`WICKET! ☝️`);
      if (data.wkts < 10) setTimeout(() => setSelModal(data.active === 1 ? 's1' : 's2'), 500);
    }

    if (runs % 2 !== 0 && type !== 'wd') data.active = data.active === 1 ? 2 : 1;

    if (data.bl === 6) { 
      data.ov += 1; data.bl = 0;
      curBwr.o += 1; curBwr.b = 0;
      data.active = data.active === 1 ? 2 : 1; 
      if (data.ov < data.maxOv && data.wkts < 10) setTimeout(() => setSelModal('bwr'), 600);
    }

    if (data.innings === 2 && data.score >= data.target) {
      data.status = 'Finished'; data.winner = data.batTeam;
    } else if (data.ov >= data.maxOv || data.wkts >= 10) {
      data.status = data.innings === 1 ? 'Innings Break' : 'Finished';
    }

    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const content = document.getElementById('full-scorecard-content').innerHTML;
    printWindow.document.write(`<html><head><title>Scorecard</title><style>body{font-family:sans-serif;padding:20px} table{width:100%;border-collapse:collapse;margin-top:15px} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f2f2f2} .title{text-align:center;color:#000}</style></head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const rates = (() => {
    if(!match) return {crr: "0.00", rrr: "0.00"};
    const totalBallsPlayed = (match.ov * 6) + match.bl;
    const crr = totalBallsPlayed > 0 ? ((match.score / totalBallsPlayed) * 6).toFixed(2) : "0.00";
    let rrr = (match.innings === 2 && (match.maxOv * 6 - totalBallsPlayed) > 0) ? (((match.target - match.score) / (match.maxOv * 6 - totalBallsPlayed)) * 6).toFixed(2) : "0.00";
    return {crr, rrr};
  })();

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}><div style={s.flexBetween}>
           <div style={{display:'flex', gap:'10px', alignItems:'center', cursor:'pointer'}} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small className="blink" style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN' : 'LIVE'}</small></div>
           </div>
           <FaHistory size={20} style={{cursor:'pointer', color:'#facc15'}} onClick={() => setShowHistory(true)} />
      </div></div>

      {(promo.text || promo.img) && (
        <div style={s.promoContainer}>
          {promo.img && <img src={promo.img} alt="Promo" style={s.promoImg} />}
          {promo.text && <div style={s.marqueeWrap}><div className="marquee-content" style={s.promoText}>⭐ {promo.text} ⭐</div></div>}
        </div>
      )}

      {match && (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'12px', fontWeight:'bold', color: '#facc15'}}>{match.lg}</div>
            <div style={{fontSize:'18px', fontWeight:'bold'}}>{match.batTeam} vs {match.bowlTeam}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.flexGapCenter}>
              <div style={s.rateBadge}>CRR: {rates.crr}</div>
              {match.innings === 2 && <div style={{...s.rateBadge, background:'#ef4444'}}>RRR: {rates.rrr}</div>}
            </div>
            <button onClick={() => setShowFullCard(true)} style={s.viewFullBtn}><FaListAlt/> VIEW FULL SCORECARD</button>
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow}>
                   <span style={{flex:2}}>{p.n}{match.active === (i+1) ? '*' : ''}</span>
                   <span style={{flex:1, textAlign:'center'}}>{p.r}({p.b})</span>
                   <span style={{flex:1, textAlign:'right'}}>{p.fours}x4, {p.sixes}x6</span>
                </div>
             ))}
             <div style={s.divider}></div>
             <div style={{...s.pRow, color:'#60a5fa'}}>
                <span style={{flex:2}}>{match.bwr}</span>
                <span style={{flex:1, textAlign:'center'}}>{(match.bowlersDict?.[match.bwr]?.o || 0)}.{match.bl}</span>
                <span style={{flex:1, textAlign:'right'}}>{match.bowlersDict?.[match.bwr]?.w || 0}-{match.bowlersDict?.[match.bwr]?.r || 0}</span>
             </div>
          </div>

          {isAdmin && match.status === 'Live' && (
            <div style={s.adminGrid}>
               {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
               <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD</button>
               <button onClick={()=>setExtraModal('nb')} style={s.nbBtn}>NB</button>
               <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
               <button onClick={() => setShowPromoModal(true)} style={{gridColumn:'span 3', ...s.saveBtn, background:'#a855f7'}}><FaBullhorn/> MANAGE ADS</button>
            </div>
          )}
        </div>
      )}

      {showFullCard && match && (
        <div style={s.overlay} onClick={() => setShowFullCard(false)}>
          <div style={{...s.modal, width:'95%', maxHeight:'90vh', overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div id="full-scorecard-content">
                <h2 style={{color:'#facc15', textAlign:'center'}}>{match.batTeam} Innings</h2>
                <p style={{textAlign:'center'}}>{match.lg} | {match.date || 'Live Match'}</p>
                <h4 style={s.tableTitle}>BATTING</h4>
                <table style={s.table}>
                    <thead>
                        <tr style={{background:'#1e293b', color:'white'}}>
                            <th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>S/R</th>
                        </tr>
                    </thead>
                    <tbody>
                        {match.battingCard?.map((b, i) => (
                            <tr key={i} style={{borderBottom:'1px solid #334155'}}>
                                <td>{b.n} <br/><small style={{color:'#ef4444'}}>{b.out}</small></td>
                                <td>{b.r}</td><td>{b.b}</td><td>{b.f}</td><td>{b.s}</td>
                                <td>{((b.r / (b.b || 1)) * 100).toFixed(1)}</td>
                            </tr>
                        ))}
                        <tr style={{background:'rgba(34,197,94,0.1)'}}>
                            <td>{match.s1.n}* <br/><small style={{color:'#22c55e'}}>not out</small></td>
                            <td>{match.s1.r}</td><td>{match.s1.b}</td><td>{match.s1.fours}</td><td>{match.s1.sixes}</td>
                            <td>{((match.s1.r / (match.s1.b || 1)) * 100).toFixed(1)}</td>
                        </tr>
                        <tr style={{background:'rgba(34,197,94,0.1)'}}>
                            <td>{match.s2.n}* <br/><small style={{color:'#22c55e'}}>not out</small></td>
                            <td>{match.s2.r}</td><td>{match.s2.b}</td><td>{match.s2.fours}</td><td>{match.s2.sixes}</td>
                            <td>{((match.s2.r / (match.s2.b || 1)) * 100).toFixed(1)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style={s.totalBox}>TOTAL: {match.score}/{match.wkts} ({match.ov}.{match.bl} Overs)</div>
                <h4 style={s.tableTitle}>BOWLING</h4>
                <table style={s.table}>
                    <thead>
                        <tr style={{background:'#1e293b', color:'white'}}>
                            <th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(match.bowlersDict || {}).map(([name, stat], i) => (
                            <tr key={i} style={{borderBottom:'1px solid #334155'}}>
                                <td>{name}</td>
                                <td>{stat.o}.{name === match.bwr ? match.bl : 0}</td>
                                <td>{stat.r}</td><td>{stat.w}</td>
                                <td>{(stat.r / ((stat.o * 6 + (name === match.bwr ? match.bl : 0)) / 6 || 1)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={s.flexGap}>
                <button onClick={generatePDF} style={{...s.goldBtn, flex:1}}><FaFilePdf/> PDF</button>
                <button onClick={() => setShowFullCard(false)} style={{...s.delBtn, flex:1, marginTop:0}}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{textAlign:'center', marginBottom:'15px'}}>ADMIN LOGIN</h3>
            <input type="password" placeholder="ENTER PIN" style={s.pinInput} autoFocus onChange={(e) => { if(e.target.value === "6545") { setIsAdmin(true); setShowAuth(false); }}} />
          </div>
        </div>
      )}

      {isAdmin && selModal && (
        <div style={s.overlay} onClick={() => setSelModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3>Select {selModal.toUpperCase()}</h3>
            <div style={{maxHeight:'300px', overflowY:'auto'}}>
                {(selModal === 'bwr' ? (match.batTeam === match.t1 ? match.t2p : match.t1p) : (match.batTeam === match.t1 ? match.t1p : match.t2p)).map((p, i) => (
                    <button key={i} style={s.pItem} onClick={() => {
                        const up = {};
                        if(selModal === 's1') up.s1 = {n:p, r:0, b:0, fours:0, sixes:0};
                        if(selModal === 's2') up.s2 = {n:p, r:0, b:0, fours:0, sixes:0};
                        if(selModal === 'bwr') {
                            up.bwr = p;
                            if(!match.bowlersDict || !match.bowlersDict[p]) {
                                let newDict = match.bowlersDict || {};
                                newDict[p] = { r:0, w:0, o:0, b:0 };
                                up.bowlersDict = newDict;
                            }
                        }
                        update(ref(db, 'liveMatch'), up);
                        setSelModal(null);
                    }}>{p}</button>
                ))}
            </div>
          </div>
        </div>
      )}

      {wktModal && (
        <div style={s.overlay}>
            <div style={s.modal}>
                <h3>How Out?</h3>
                {['Bold', 'Caught', 'Run Out', 'LBW', 'Stumped'].map(t => (
                    <button key={t} onClick={()=>handleScore(0, 'normal', t)} style={s.pItem}>{t}</button>
                ))}
                <button onClick={()=>setWktModal(false)} style={s.delBtn}>CANCEL</button>
            </div>
        </div>
      )}

      {extraModal && (
        <div style={s.overlay}>
            <div style={s.modal}>
                <h3>+{extraModal} Runs</h3>
                <div style={s.adminGrid}>
                    {[0,1,2,3,4,6].map(v => <button key={v} onClick={()=>handleScore(v, extraModal)} style={s.numBtn}>+{v}</button>)}
                </div>
                <button onClick={()=>setExtraModal(null)} style={s.delBtn}>CLOSE</button>
            </div>
        </div>
      )}

    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  avatar: { width:'40px', height:'40px', background:'#facc15', color:'black', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  promoContainer: { margin: '10px 15px', background: '#1e293b', border: '1px solid #facc15', borderRadius: '12px', overflow: 'hidden' },
  promoImg: { width: '100%', maxHeight: '150px', objectFit: 'cover' },
  marqueeWrap: { padding: '8px', overflow: 'hidden' },
  promoText: { color: '#facc15', fontWeight: 'bold' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', border:'1px solid #334155' },
  mainScore: { fontSize:'50px', fontWeight:'bold', color:'#facc15' },
  viewFullBtn: { marginTop:'15px', padding:'10px', background:'rgba(250,204,21,0.1)', color:'#facc15', border:'1px solid #facc15', borderRadius:'10px', width:'100%', fontWeight:'bold' },
  playerCard: { background:'#0f172a', margin:'10px 0', padding:'15px', borderRadius:'15px' },
  activeP: { display:'flex', padding:'8px 0', color:'#facc15', fontWeight:'bold', borderBottom:'1px solid #1e293b' },
  pRow: { display:'flex', padding:'8px 0', opacity:0.7, borderBottom:'1px solid #1e293b' },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'10px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  saveBtn: { padding:'15px', background:'#a855f7', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', padding:'20px', borderRadius:'20px', width:'85%' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#0f172a', color:'white', border:'1px solid #334155', borderRadius:'8px' },
  goldBtn: { padding:'12px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  delBtn: { padding:'12px', background:'#ef4444', color:'white', fontWeight:'bold', border:'none', borderRadius:'8px', width:'100%', marginTop:'10px' },
  table: { width:'100%', marginTop:'10px', fontSize:'12px', textAlign:'left', borderCollapse:'collapse', color:'white' },
  tableTitle: { marginTop:'20px', color:'#facc15', borderBottom:'1px solid #334155', paddingBottom:'5px' },
  totalBox: { marginTop:'10px', padding:'10px', background:'#0f172a', borderRadius:'8px', fontWeight:'bold', textAlign:'right', color:'#facc15', border:'1px solid #334155' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', width:'100%', boxSizing:'border-box' },
  flexBetween: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  flexGap: { display:'flex', gap:'10px', marginTop:'20px' },
  flexGapCenter: { display:'flex', gap:'10px', justifyContent:'center', marginTop:'10px' },
  rateBadge: { background:'#1e293b', padding:'4px 10px', borderRadius:'5px', color:'#facc15', fontSize:'11px', border:'1px solid #334155' },
  pItem: { width:'100%', padding:'12px', background:'#0f172a', color:'white', border:'none', borderBottom:'1px solid #334155', textAlign:'left' },
  divider: { height:'1px', background:'#334155', margin:'10px 0' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:6000 }
};
