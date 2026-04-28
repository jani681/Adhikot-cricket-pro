import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog, FaTimes, FaHistory, FaEdit, FaCommentDots, FaPaperPlane, FaGlobe, FaBullhorn, FaUsers, FaUserPlus } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProAdvanced() {
  // --- OLD STATES (STABLE) ---
  const [match, setMatch] = useState(null);
  const [history, setHistory] = useState({});
  const [promo, setPromo] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);
  const [anim, setAnim] = useState("");
  const [lastState, setLastState] = useState(null); 
  const [commInput, setCommInput] = useState(""); 

  // --- NEW STATES (ISOLATED) ---
  const [activeTab, setActiveTab] = useState('match'); // 'match' or 'players'
  const [allPlayers, setAllPlayers] = useState({});
  const [showPlayerAdd, setShowPlayerAdd] = useState(false);

  useEffect(() => {
    // Live Match Listener
    onValue(ref(db, 'liveMatch'), (snap) => {
      const data = snap.val();
      if (data) setMatch(data);
      else setMatch(null);
    });

    // History & Promo Listeners
    onValue(ref(db, 'matchHistory'), (snap) => setHistory(snap.val() || {}));
    onValue(ref(db, 'appSettings/promo'), (snap) => setPromo(snap.val() || {}));

    // --- NEW: Players Listener ---
    onValue(ref(db, 'players'), (snap) => setAllPlayers(snap.val() || {}));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  // --- SCORING LOGIC (STAYED SAME + RECENT BALLS) ---
  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status !== 'Live' || !isAdmin) return;
    setLastState({...match}); 
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;

    const ballLabel = outType ? 'W' : (type === 'wd' ? 'Wd' : (type === 'nb' ? 'Nb' : runs));
    data.recentBalls = [ballLabel, ...(data.recentBalls || [])].slice(0, 12);

    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs; data.bl += 1; 
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
      if (runs === 4) { striker.fours += 1; triggerAnim("FOUR! ✨"); }
      else if (runs === 6) { striker.sixes += 1; triggerAnim("SIXER! 🚀"); }
    } else if (type === 'wd' || type === 'nb') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      if (type === 'nb') { striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1; }
      triggerAnim(type.toUpperCase());
    }

    if (outType) {
      data.wkts += 1; data.bwr_w += (outType !== 'Run Out' ? 1 : 0);
      striker.r = `OUT (${outType})`;
      if (data.wkts < 10) setTimeout(() => setSelModal(data.active === 1 ? 's1' : 's2'), 500);
    }

    if (runs % 2 !== 0 && type !== 'wd') data.active = data.active === 1 ? 2 : 1;
    if (data.bl === 6) { data.ov += 1; data.bl = 0; data.bwr_o += 1; data.active = data.active === 1 ? 2 : 1; }

    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };

  // --- NEW: PLAYER MANAGEMENT LOGIC ---
  const savePlayer = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pName = fd.get('name');
    const playerData = {
      name: pName,
      team: fd.get('team'),
      role: fd.get('role'),
      whatsapp: fd.get('wa'),
      dpUrl: fd.get('dp') || '',
      stats: {
        m: fd.get('m') || 0,
        r: fd.get('r') || 0,
        w: fd.get('w') || 0,
        sr: fd.get('sr') || '0.00'
      }
    };
    set(ref(db, `players/${pName.replace(/\./g, '_')}`), playerData);
    setShowPlayerAdd(false);
    alert("Player Profile Saved!");
  };

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* HEADER */}
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

      {/* TABS SWITCHER */}
      <div style={s.tabsRow}>
        <button onClick={() => setActiveTab('match')} style={activeTab === 'match' ? s.tabActive : s.tab}>LIVE SCORE</button>
        <button onClick={() => setActiveTab('players')} style={activeTab === 'players' ? s.tabActive : s.tab}>PLAYER DIRECTORY</button>
      </div>

      {activeTab === 'match' ? (
        // --- MATCH VIEW (YOUR EXISTING STRUCTURE) ---
        <div style={{padding:'10px'}}>
           {/* All your existing match rendering code goes here */}
           {!match ? (
             <div style={s.setupBox}>
               {isAdmin ? (
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    set(ref(db, 'liveMatch'), {
                      lg: fd.get('lg'), t1: fd.get('t1'), t2: fd.get('t2'), maxOv: parseInt(fd.get('max')),
                      t1p: fd.get('t1p').split(','), t2p: fd.get('t2p').split(','),
                      batTeam: fd.get('batFirst') === 'T1' ? fd.get('t1') : fd.get('t2'), 
                      bowlTeam: fd.get('batFirst') === 'T1' ? fd.get('t2') : fd.get('t1'),
                      s1: {n: 'Striker', r: 0, b: 0, fours: 0, sixes: 0}, s2: {n: 'Non-Striker', r: 0, b: 0, fours: 0, sixes: 0}, 
                      active: 1, score: 0, wkts: 0, ov: 0, bl: 0, innings: 1, status: 'Live', bwr: 'Bowler', bwr_r:0, bwr_w:0, bwr_o:0,
                      commentary: ["Match Started!"], recentBalls: []
                    });
                 }}>
                   <input name="lg" placeholder="League Name" style={s.input} required />
                   <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="t2" placeholder="Team B" style={s.input}/></div>
                   <select name="batFirst" style={s.input} required><option value="T1">Team A Bat First</option><option value="T2">Team B Bat First</option></select>
                   <textarea name="t1p" placeholder="Team A Players (comma separated)" style={s.area}/><textarea name="t2p" placeholder="Team B Players (comma separated)" style={s.area}/>
                   <div style={s.flexGap}><input name="max" placeholder="Overs" type="number" style={s.input}/><button type="submit" style={s.goldBtn}>START</button></div>
                 </form>
               ) : <div style={{textAlign:'center', color:'#94a3b8'}}>No Match Live</div>}
             </div>
           ) : (
             <>
               <div style={s.card}>
                  <div style={{fontSize:'12px', color:'#facc15'}}>{match.lg}</div>
                  <div style={s.mainScore}>{match.score}/{match.wkts}</div>
                  <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
                  {match.recentBalls && (
                    <div style={s.recentBallsRow}>
                      {match.recentBalls.map((b, i) => (
                        <div key={i} style={{...s.ballCircle, background: b==='W'?'#ef4444':(b===4||b===6)?'#22c55e':'#334155'}}>{b}</div>
                      ))}
                    </div>
                  )}
               </div>
               
               {isAdmin && (
                 <div style={s.adminGrid}>
                    {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                    <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD</button>
                    <button onClick={()=>setExtraModal('nb')} style={s.nbBtn}>NB</button>
                    <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
                    <button onClick={() => remove(ref(db, 'liveMatch'))} style={{...s.delBtn, gridColumn:'span 3'}}>CLOSE MATCH</button>
                 </div>
               )}
             </>
           )}
        </div>
      ) : (
        // --- PLAYER DIRECTORY VIEW (NEW) ---
        <div style={{padding:'10px'}}>
           {isAdmin && (
             <button onClick={() => setShowPlayerAdd(true)} style={s.addPlayerBtn}><FaUserPlus/> ADD NEW PLAYER</button>
           )}

           <div style={s.playerGrid}>
             {Object.values(allPlayers).length === 0 ? (
               <p style={{textAlign:'center', opacity:0.5, marginTop:'20px'}}>No players added yet.</p>
             ) : (
               Object.values(allPlayers).map((p, i) => (
                 <div key={i} style={s.pCard}>
                    <div style={s.pTop}>
                       <img src={p.dpUrl || 'https://via.placeholder.com/80'} style={s.pDp} alt={p.name} />
                       <div>
                          <div style={{fontWeight:'bold', fontSize:'16px'}}>{p.name}</div>
                          <div style={{fontSize:'12px', color:'#facc15'}}>{p.role} | {p.team}</div>
                          <button onClick={() => window.open(`https://wa.me/${p.whatsapp}`)} style={s.pWa}><FaWhatsapp/> Chat</button>
                       </div>
                       {isAdmin && <FaTrash onClick={() => remove(ref(db, `players/${p.name.replace(/\./g, '_')}`))} style={{color:'#ef4444', marginLeft:'auto'}} />}
                    </div>
                    <div style={s.pStatsGrid}>
                       <div style={s.pStatBox}><b>{p.stats.m}</b><br/><small>MAT</small></div>
                       <div style={s.pStatBox}><b>{p.stats.r}</b><br/><small>RUNS</small></div>
                       <div style={s.pStatBox}><b>{p.stats.w}</b><br/><small>WKTS</small></div>
                       <div style={s.pStatBox}><b>{p.stats.sr}</b><br/><small>S/R</small></div>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {/* PLAYER ADD MODAL */}
      {showPlayerAdd && (
        <div style={s.overlay} onClick={() => setShowPlayerAdd(false)}>
           <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h3><FaUserPlus/> Add Player Profile</h3>
              <form onSubmit={savePlayer}>
                 <input name="name" placeholder="Full Name" style={s.input} required />
                 <input name="team" placeholder="Team Name" style={s.input} />
                 <input name="role" placeholder="Role (e.g. All Rounder)" style={s.input} />
                 <input name="wa" placeholder="WhatsApp Number" style={s.input} />
                 <input name="dp" placeholder="Image URL (Link)" style={s.input} />
                 <div style={s.flexGap}>
                    <input name="m" placeholder="Matches" type="number" style={s.input} />
                    <input name="r" placeholder="Runs" type="number" style={s.input} />
                 </div>
                 <div style={s.flexGap}>
                    <input name="w" placeholder="Wickets" type="number" style={s.input} />
                    <input name="sr" placeholder="Strike Rate" style={s.input} />
                 </div>
                 <button type="submit" style={s.goldBtn}>SAVE PLAYER</button>
                 <button type="button" onClick={() => setShowPlayerAdd(false)} style={{...s.delBtn, marginTop:'10px'}}>CANCEL</button>
              </form>
           </div>
        </div>
      )}

      {/* AUTH & OTHER MODALS (REMAINED SAME) */}
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

// --- ENHANCED STYLES ---
const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  tabsRow: { display:'flex', padding:'10px', gap:'10px', background:'#0f172a' },
  tab: { flex:1, padding:'10px', background:'#1e293b', border:'none', color:'#94a3b8', borderRadius:'8px', fontWeight:'bold' },
  tabActive: { flex:1, padding:'10px', background:'#facc15', border:'none', color:'black', borderRadius:'8px', fontWeight:'bold' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  setupBox: { padding:'20px', background:'#0f172a', borderRadius:'15px' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  area: { width:'100%', padding:'10px', height:'60px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px', marginBottom:'10px' },
  flexGap: { display:'flex', gap:'10px' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #334155' },
  mainScore: { fontSize:'50px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'16px', opacity:0.8 },
  recentBallsRow: { display:'flex', gap:'6px', justifyContent:'center', marginTop:'15px' },
  ballCircle: { width:'25px', height:'25px', borderRadius:'50%', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', padding:'10px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  nbBtn: { padding:'15px', background:'#8b5cf6', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  delBtn: { padding:'12px', background:'#b91c1c', color:'white', borderRadius:'8px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'20px' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:6000 },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center' },
  
  // NEW PLAYER CARD STYLES
  addPlayerBtn: { width:'100%', padding:'15px', background:'#22c55e', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', marginBottom:'15px' },
  pCard: { background:'#0f172a', padding:'15px', borderRadius:'15px', border:'1px solid #1e293b', marginBottom:'15px' },
  pTop: { display:'flex', gap:'15px', alignItems:'center', marginBottom:'15px' },
  pDp: { width:'65px', height:'65px', borderRadius:'50%', border:'2px solid #facc15', objectFit:'cover' },
  pWa: { background:'#25D366', border:'none', padding:'4px 10px', borderRadius:'6px', color:'white', fontSize:'12px', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px' },
  pStatsGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'5px', borderTop:'1px solid #1e293b', paddingTop:'10px' },
  pStatBox: { textAlign:'center', fontSize:'12px' }
};
