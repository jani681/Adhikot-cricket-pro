import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog, FaTimes, FaHistory, FaEdit, FaCommentDots, FaPaperPlane, FaChartLine } from 'react-icons/fa';

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
  const [commInput, setCommInput] = useState(""); 

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    onValue(matchRef, (snap) => {
      const data = snap.val();
      if (data) {
        if (data.status === 'Live') {
          if (data.innings === 2 && data.score >= data.target) {
            data.status = 'Finished';
            data.winner = data.batTeam;
          } else if (data.ov >= data.maxOv || data.wkts >= 10) {
            data.status = data.innings === 1 ? 'Innings Break' : 'Finished';
            if (data.status === 'Finished' && !data.winner) {
              data.winner = data.score < data.target - 1 ? data.bowlTeam : (data.score === data.target - 1 ? 'Tie' : data.batTeam);
            }
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

  const postCommentary = (text) => {
    if (!text || !match) return;
    const newComm = [text, ...(match.commentary || [])].slice(0, 5); 
    update(ref(db, 'liveMatch'), { commentary: newComm });
    setCommInput("");
  };

  const shareToWhatsApp = () => {
    if (!match) return;
    const totalBalls = (match.ov * 6) + match.bl;
    const crr = totalBalls > 0 ? ((match.score / totalBalls) * 6).toFixed(2) : "0.00";
    const lastComm = match.commentary ? `\n💬 *Last Action:* ${match.commentary[0]}` : "";
    
    let msg = `🏏 *LIVE CRICKET UPDATE* 🏏\n\n`;
    msg += `🏆 *${match.lg}*\n`;
    msg += `⚔️ *${match.t1}* vs *${match.t2}*\n\n`;
    msg += `🔴 *LIVE:* ${match.batTeam} batting\n`;
    msg += `📊 *Score:* ${match.score}/${match.wkts}\n`;
    msg += `⏳ *Overs:* ${match.ov}.${match.bl} (${match.maxOv})\n`;
    msg += `📈 *CRR:* ${crr}\n`;
    if(match.target > 0) msg += `🎯 *Target:* ${match.target}\n`;
    msg += `${lastComm}\n\n📲 *Shared via Adhikot Cricket Pro*`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- CORE SCORING LOGIC (UNCHANGED) ---
  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status !== 'Live' || !isAdmin) return;
    setLastState({...match}); 
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;
    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs; data.bl += 1;
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
      if (runs === 4) { striker.fours += 1; triggerAnim("FOUR! ✨"); postCommentary(`${striker.n} hits a FOUR! ✨`); }
      else if (runs === 6) { striker.sixes += 1; triggerAnim("SIXER! 🚀"); postCommentary(`${striker.n} hits a massive SIX! 🚀`); }
      else { postCommentary(`${striker.n} scores ${runs} run(s)`); }
    } else if (type === 'wd') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      triggerAnim(`WIDE +${runs}`);
      postCommentary(`Wide ball. +${1+runs} extra runs added.`);
    } else if (type === 'nb') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
      triggerAnim(`NO BALL +${runs}`);
      postCommentary(`No Ball! ${striker.n} scores from the extra.`);
    }
    if (outType) {
      data.wkts += 1; data.bwr_w += (outType !== 'Run Out' ? 1 : 0);
      if (type === 'normal') data.bl += 1;
      const outName = striker.n;
      striker.r = `OUT (${outType})`;
      triggerAnim(`WICKET! (${outType}) ☝️`);
      postCommentary(`WICKET! ${outName} is OUT by ${outType}. ☝️`);
      if (data.wkts < 10) setTimeout(() => setSelModal(data.active === 1 ? 's1' : 's2'), 500);
    }
    if (runs % 2 !== 0 && type !== 'wd') data.active = data.active === 1 ? 2 : 1;
    if (data.bl === 6) { 
      data.ov += 1; data.bl = 0; data.bwr_o += 1; data.active = data.active === 1 ? 2 : 1; 
      triggerAnim("OVER! 🔄");
      postCommentary(`End of over ${data.ov}. Score: ${data.score}/${data.wkts}`);
      if (data.ov < data.maxOv) setTimeout(() => setSelModal('bwr'), 600);
    }
    if (data.innings === 2 && data.score >= data.target) {
      data.status = 'Finished';
      data.winner = data.batTeam;
    } else if (data.ov >= data.maxOv || data.wkts >= 10) {
      data.status = data.innings === 1 ? 'Innings Break' : 'Finished';
    }
    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };
  // --- END OF CORE LOGIC ---

  const endMatchManually = () => {
    if (!match || !isAdmin) return;
    if (window.confirm("Do you want to end this match now?")) {
      let data = { ...match };
      data.status = 'Finished';
      data.winner = data.innings === 1 ? "No Result" : (data.score >= data.target ? data.batTeam : data.bowlTeam);
      postCommentary("Match ended by Administrator.");
      update(ref(db, 'liveMatch'), data);
    }
  };

  const undoLastAction = () => {
    if (lastState && isAdmin) {
      update(ref(db, 'liveMatch'), lastState);
      setLastState(null);
      alert("Last Action Undone!");
    }
  };

  const saveMatchToHistory = () => {
    if (!match || !isAdmin) return;
    push(ref(db, 'matchHistory'), { ...match, timestamp: Date.now() });
    alert("Match Saved to History!");
  };

  const closeMatch = () => {
    if (window.confirm("Are you sure you want to close this match?") && isAdmin) {
      remove(ref(db, 'liveMatch'));
      alert("Match Closed!");
    }
  };

  const calculateRates = () => {
    if(!match) return {crr: "0.00", rrr: "0.00", progress: 0, total4s: 0, total6s: 0};
    const totalBallsPlayed = (match.ov * 6) + match.bl;
    const crr = totalBallsPlayed > 0 ? ((match.score / totalBallsPlayed) * 6).toFixed(2) : "0.00";
    const progress = (totalBallsPlayed / (match.maxOv * 6)) * 100;
    
    let rrr = "0.00";
    if (match.innings === 2 && match.status === 'Live') {
      const ballsLeft = (match.maxOv * 6) - totalBallsPlayed;
      const runsNeeded = match.target - match.score;
      rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "0.00";
    }

    // UPDATE 2: Boundary Counter (calculated from player objects)
    const t4 = (parseInt(match.s1.fours) || 0) + (parseInt(match.s2.fours) || 0);
    const t6 = (parseInt(match.s1.sixes) || 0) + (parseInt(match.s2.sixes) || 0);

    return {crr, rrr, progress, total4s: t4, total6s: t6};
  };

  const rates = calculateRates();

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}><div style={s.flexBetween}>
           <div style={s.flex} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small className="blink" style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN ACTIVE' : 'LIVE'}</small></div>
           </div>
           <div style={s.flex}>
             <FaHistory size={20} style={{cursor:'pointer', color:'#facc15'}} onClick={() => setShowHistory(true)} />
             <FaCog size={20} style={{opacity:0.5, marginLeft:'15px'}} onClick={() => setShowAuth(true)} />
           </div>
      </div></div>

      <style>{`
        .blink { animation: blinker 1.5s linear infinite; }
        @keyframes blinker { 50% { opacity: 0.3; } }
        .score-pulse { animation: pulse 2s ease-in-out; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); color: #fff; } 100% { transform: scale(1); } }
      `}</style>

      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <input type="password" placeholder="ENTER PIN" style={s.pinInput} autoFocus onChange={(e) => { if(e.target.value === "6545") { setIsAdmin(true); setShowAuth(false); }}} />
          </div>
        </div>
      )}

      {showHistory && (
        <div style={s.overlay} onClick={() => setShowHistory(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.flexBetween}><h3 style={{color:'#facc15'}}>Match History</h3></div>
            <div style={{maxHeight:'60vh', overflowY:'auto', marginTop:'15px'}}>
                {Object.keys(history).length === 0 ? <p>No history found.</p> : 
                 Object.entries(history).reverse().map(([id, m]) => (
                    <div key={id} style={s.historyItem}>
                        <div style={{fontWeight:'bold'}}>{m.t1} vs {m.t2}</div>
                        <div style={{color:'#facc15'}}>Score: {m.score}/{m.wkts} ({m.ov}.{m.bl})</div>
                    </div>
                ))}
            </div>
            <button onClick={() => setShowHistory(false)} style={s.goldBtn}>CLOSE</button>
          </div>
        </div>
      )}

      {!match ? (
        <div style={s.setupBox}>
          {isAdmin ? (
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const t1 = fd.get('t1'), t2 = fd.get('t2'), batFirst = fd.get('batFirst');
                set(ref(db, 'liveMatch'), {
                  lg: fd.get('lg'), t1, t2, c1: fd.get('c1'), c2: fd.get('c2'), 
                  emp: fd.get('emp'), date: fd.get('date'), time: fd.get('time'), maxOv: parseInt(fd.get('max')),
                  t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
                  batTeam: batFirst === 'T1' ? t1 : t2, bowlTeam: batFirst === 'T1' ? t2 : t1,
                  s1: {n: 'Striker', r: 0, b: 0, fours: 0, sixes: 0}, s2: {n: 'Non-Striker', r: 0, b: 0, fours: 0, sixes: 0}, 
                  active: 1, score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', bwr: 'Bowler', bwr_r:0, bwr_w:0, bwr_o:0,
                  commentary: ["Match Started!"]
                });
              }}>
                <h3 style={{color:'#facc15'}}>New Match Setup</h3>
                <input name="lg" placeholder="League Name" style={s.input} required />
                <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="t2" placeholder="Team B" style={s.input}/></div>
                <select name="batFirst" style={s.input} required><option value="T1">Team A Batting</option><option value="T2">Team B Batting</option></select>
                <div style={s.flexGap}><input name="max" placeholder="Overs" type="number" style={s.input}/><button type="submit" style={s.goldBtn}>START</button></div>
              </form>
          ) : <div style={{textAlign:'center'}}><h3>Waiting for Match...</h3></div>}
        </div>
      ) : (
        <div style={{padding:'10px'}}>
          
          {/* UPDATE 1: Progress Bar */}
          {match.status === 'Live' && (
            <div style={s.progressContainer}>
              <div style={{...s.progressBar, width: `${rates.progress}%`}}></div>
            </div>
          )}

          <div style={s.card}>
            {match.status === 'Finished' ? (
              <div style={s.fullScoreboard}>
                 <div style={s.winBanner}>{match.winner} WON! 🏆</div>
                 <h2 style={{color:'#facc15'}}>{match.score}/{match.wkts}</h2>
              </div>
            ) : (
              <>
                <div style={{fontSize:'12px', color: '#facc15'}}>{match.lg}</div>
                <div style={{fontSize:'16px', fontWeight:'bold'}}>{match.batTeam} vs {match.bowlTeam}</div>
                <div key={match.score} className="score-pulse" style={s.mainScore}>{match.score}/{match.wkts}</div>
                <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv} Overs</div>
                
                <div style={{display:'flex', justifyContent:'center', gap:'10px', marginTop:'10px'}}>
                   <div style={s.rateBadge}>CRR: {rates.crr}</div>
                   {match.innings === 2 && <div style={{...s.rateBadge, background:'#ef4444'}}>RRR: {rates.rrr}</div>}
                   {/* UPDATE 2: Boundary Highlight in Badge */}
                   <div style={{...s.rateBadge, background:'#1e293b'}}>💥 {rates.total4s}x4 | {rates.total6s}x6</div>
                </div>

                {match.target > 0 && <div style={s.targetBox}>Target: {match.target}</div>}
              </>
            )}
          </div>

          <div style={s.commBox}>
            <div style={{color:'#facc15', fontSize:'12px', fontWeight:'bold'}}><FaCommentDots/> COMMENTARY</div>
            {match.commentary?.map((c, i) => (
              <div key={i} style={{...s.commItem, opacity: i === 0 ? 1 : 0.6}}>
                {i === 0 && <span style={s.newDot}></span>} {c}
              </div>
            ))}
          </div>

          {match.status === 'Live' && (
            <div style={s.playerCard}>
               {[match.s1, match.s2].map((p, i) => (
                  <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow} onClick={() => isAdmin && setSelModal(i === 0 ? 's1' : 's2')}>
                     <span style={{flex:2}}>{p.n}{match.active === (i+1) ? '*' : ''}</span>
                     <span style={{flex:1, textAlign:'center'}}>{p.r}({p.b})</span>
                     <span style={{flex:1, textAlign:'right'}}>{p.fours}x4 {p.sixes}x6</span>
                  </div>
               ))}
               <div style={s.divider}></div>
               <div style={s.pRow} onClick={() => isAdmin && setSelModal('bwr')}>
                  <span style={{flex:2, color:'#60a5fa'}}>{match.bwr}</span>
                  <span style={{flex:1, textAlign:'right'}}>{match.bwr_w}-{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
               </div>
            </div>
          )}

          {isAdmin && (
            <div style={s.adminGrid}>
              {match.status === 'Live' && (
                <>
                  {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                  <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD+</button>
                  <button onClick={()=>setExtraModal('nb')} style={s.nbBtn}>NB+</button>
                  <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
                  <div style={{gridColumn:'span 3', display:'flex', gap:'5px'}}>
                    <input value={commInput} onChange={e=>setCommInput(e.target.value)} placeholder="Commentary..." style={s.commInput} />
                    <button onClick={()=>postCommentary(commInput)} style={s.postBtn}><FaPaperPlane/></button>
                  </div>
                  <button onClick={undoLastAction} style={s.editBtn}>UNDO</button>
                  <button onClick={shareToWhatsApp} style={s.waBtn}><FaWhatsapp/> SHARE</button>
                  <button onClick={endMatchManually} style={s.delBtn}>END</button>
                </>
              )}
              <div style={{gridColumn:'span 3', display:'flex', flexDirection:'column', gap:'10px', marginTop:'10px'}}>
                {match.status === 'Innings Break' && <button onClick={() => update(ref(db, 'liveMatch'), {innings: 2, score: 0, wkts: 0, ov: 0, bl: 0, target: match.score + 1, status: 'Live', batTeam: match.bowlTeam, bowlTeam: match.batTeam, bwr_r:0, bwr_w:0, bwr_o:0, bwr:'Bowler', commentary: ["Innings Started!"]})} style={s.saveBtn}>START 2ND INNINGS</button>}
                <button onClick={saveMatchToHistory} style={s.saveBtn}><FaSave/> SAVE HISTORY</button>
                <button onClick={closeMatch} style={s.delBtn}>CLOSE MATCH</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals remain the same */}
      {extraModal && <div style={s.overlay}><div style={s.modal}><h3>Extras</h3><div style={s.grid3}>{[0,1,2,3,4].map(v => <button key={v} onClick={()=>handleScore(v, extraModal)} style={s.numBtn}>+{v}</button>)}<button onClick={()=>setExtraModal(null)} style={s.delBtn}>CLOSE</button></div></div></div>}
      {wktModal && <div style={s.overlay}><div style={s.modal}><h3>Out</h3>{['Bold', 'Caught', 'Run Out', 'LBW'].map(t => (<button key={t} onClick={()=>handleScore(0, 'normal', t)} style={s.pItem}>{t}</button>))}<button onClick={()=>setWktModal(false)} style={s.delBtn}>CANCEL</button></div></div>}
      {isAdmin && selModal && <div style={s.overlay} onClick={() => setSelModal(null)}><div style={s.modal} onClick={e => e.stopPropagation()}><h3>Select Player</h3>{(selModal === 'bwr' ? (match.batTeam === match.t1 ? match.t2p : match.t1p) : (match.batTeam === match.t1 ? match.t1p : match.t2p)).map((p, i) => (<div key={i} style={s.pItem} onClick={() => { const up = {}; if(selModal==='s1') up.s1 = {n:p, r:0, b:0, fours:0, sixes:0}; if(selModal==='s2') up.s2 = {n:p, r:0, b:0, fours:0, sixes:0}; if(selModal==='bwr') { up.bwr = p; up.bwr_r = 0; up.bwr_w = 0; up.bwr_o = match.ov; } update(ref(db, 'liveMatch'), up); setSelModal(null); }}>{p}</div>))}</div></div>}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  progressContainer: { height:'4px', background:'#1e293b', margin:'0 10px', borderRadius:'10px', overflow:'hidden' },
  progressBar: { height:'100%', background:'#facc15', transition:'width 0.5s ease' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #334155' },
  mainScore: { fontSize:'55px', fontWeight:'bold', color:'#facc15' },
  commBox: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  commItem: { fontSize:'13px', padding:'6px 0', borderBottom:'1px solid #1e293b', display:'flex', alignItems:'center', gap:'8px' },
  newDot: { width:'6px', height:'6px', background:'#facc15', borderRadius:'50%' },
  targetBox: { background:'#facc15', color:'black', padding:'5px 15px', borderRadius:'20px', fontWeight:'bold', marginTop:'10px', display:'inline-block' },
  playerCard: { background:'#0f172a', margin:'10px', padding:'15px', borderRadius:'15px' },
  pRow: { display:'flex', justifyContent:'space-between', padding:'8px 0', opacity:0.7, fontSize:'14px' },
  activeP: { display:'flex', justifyContent:'space-between', padding:'8px 0', color:'#facc15', fontWeight:'bold', fontSize:'14px' },
  divider: { height:'1px', background:'#334155', margin:'10px 0' },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', padding:'10px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', border:'none' },
  nbBtn: { padding:'15px', background:'#8b5cf6', color:'white', borderRadius:'10px', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', border:'none' },
  waBtn: { padding:'15px', background:'#25D366', color:'white', borderRadius:'10px', border:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' },
  commInput: { flex:1, padding:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px' },
  postBtn: { padding:'10px 15px', background:'#facc15', color:'black', borderRadius:'8px', border:'none' },
  saveBtn: { width:'100%', padding:'12px', background:'#22c55e', color:'white', borderRadius:'8px', border:'none' },
  delBtn: { width:'100%', padding:'12px', background:'#b91c1c', color:'white', borderRadius:'8px', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'20px' },
  historyItem: { background:'#0f172a', padding:'12px', borderRadius:'10px', marginBottom:'10px', borderLeft:'4px solid #facc15' },
  pItem: { width:'100%', padding:'12px', background:'none', color:'white', border:'none', borderBottom:'1px solid #334155', textAlign:'left' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:6000 },
  rateBadge: { background:'#1e293b', color:'#facc15', padding:'4px 10px', borderRadius:'5px', fontSize:'12px', border:'1px solid #334155', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', margin:'15px', borderRadius:'15px' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px' },
  flexGap: { display:'flex', gap:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  overInfo: { fontSize:'18px', opacity:0.8 }
};

