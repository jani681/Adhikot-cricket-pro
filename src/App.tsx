import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaHistory, FaCog, FaTrash, FaUserPlus, FaUsers, FaTimes } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProAdvanced() {
  // --- STATES ---
  const [match, setMatch] = useState(null);
  const [history, setHistory] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);
  const [anim, setAnim] = useState("");
  
  // NEW STATES FOR PLAYERS
  const [activeTab, setActiveTab] = useState('match'); 
  const [allPlayers, setAllPlayers] = useState({});
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'matchHistory'), (snap) => setHistory(snap.val() || {}));
    onValue(ref(db, 'players'), (snap) => setAllPlayers(snap.val() || {}));
  }, []);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status !== 'Live' || !isAdmin) return;
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;
    const ballLabel = outType ? 'W' : (type === 'wd' ? 'Wd' : (type === 'nb' ? 'Nb' : runs));
    data.recentBalls = [ballLabel, ...(data.recentBalls || [])].slice(0, 12);

    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs; data.bl += 1;
      striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1;
      if (runs === 4) triggerAnim("FOUR! ✨");
      if (runs === 6) triggerAnim("SIXER! 🚀");
    } else if (type === 'wd' || type === 'nb') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      if (type === 'nb') { striker.r = (parseInt(striker.r) || 0) + runs; striker.b += 1; }
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

  const addPlayer = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('pname');
    const pData = {
      name: name, team: fd.get('pteam'), role: fd.get('prole'),
      wa: fd.get('pwa'), dp: fd.get('pdp') || '',
      st: { m: fd.get('pm')||0, r: fd.get('pr')||0, w: fd.get('pw')||0, sr: fd.get('psr')||'0.0' }
    };
    set(ref(db, `players/${name.replace(/\s/g, '_')}`), pData);
    setShowAddPlayer(false);
  };

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.flexBetween}>
          <div style={s.flex} onClick={() => setShowAuth(true)}>
            <div style={s.avatar}>T</div>
            <div><b>Touqeer Iqbal</b><br/><small style={{color: isAdmin ? '#22c55e' : '#facc15'}}>● {isAdmin ? 'ADMIN' : 'LIVE'}</small></div>
          </div>
          <FaHistory size={20} style={{cursor:'pointer', color:'#facc15'}} onClick={() => setShowHistory(true)} />
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabsRow}>
        <button onClick={() => setActiveTab('match')} style={{...s.tab, background: activeTab==='match'?'#facc15':'#1e293b', color: activeTab==='match'?'black':'white'}}>LIVE SCORE</button>
        <button onClick={() => setActiveTab('players')} style={{...s.tab, background: activeTab==='players'?'#facc15':'#1e293b', color: activeTab==='players'?'black':'white'}}>PLAYERS</button>
      </div>

      <div style={{padding:'15px'}}>
        {activeTab === 'match' ? (
          /* MATCH SECTION */
          !match ? (
            <div style={s.card}>
              {isAdmin ? (
                <button onClick={() => set(ref(db, 'liveMatch'), {
                  lg: "Tournament", t1: "Team A", t2: "Team B", maxOv: 5,
                  s1: {n: 'Batsman 1', r: 0, b: 0}, s2: {n: 'Batsman 2', r: 0, b: 0},
                  active: 1, score: 0, wkts: 0, ov: 0, bl: 0, bwr: 'Bowler', bwr_r:0, bwr_w:0, bwr_o:0, recentBalls: []
                })} style={s.goldBtn}>START NEW MATCH</button>
              ) : <p style={{textAlign:'center', opacity:0.5}}>No Match Live</p>}
            </div>
          ) : (
            <>
              <div style={s.card}>
                <div style={{fontSize:'14px', color:'#facc15'}}>{match.lg}</div>
                <div style={s.mainScore}>{match.score}/{match.wkts}</div>
                <div style={s.overInfo}>Overs: {match.ov}.{match.bl} ({match.maxOv})</div>
                <div style={s.ballRow}>
                  {match.recentBalls && match.recentBalls.map((b, i) => (
                    <div key={i} style={{...s.ball, background: b==='W'?'#ef4444':(b===4||b===6)?'#22c55e':'#334155'}}>{b}</div>
                  ))}
                </div>
              </div>
              {isAdmin && (
                <div style={s.grid}>
                  {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
                  <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD</button>
                  <button onClick={()=>setExtraModal('nb')} style={s.nbBtn}>NB</button>
                  <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
                  <button onClick={()=>remove(ref(db, 'liveMatch'))} style={s.delBtn}>CLOSE</button>
                </div>
              )}
            </>
          )
        ) : (
          /* PLAYERS SECTION */
          <div>
            {isAdmin && <button onClick={()=>setShowAddPlayer(true)} style={s.addBtn}><FaUserPlus/> ADD PLAYER</button>}
            {Object.values(allPlayers).map((p, i) => (
              <div key={i} style={s.pCard}>
                <div style={s.pTop}>
                  <img src={p.dp || 'https://via.placeholder.com/60'} style={s.pDp} alt="dp" />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'bold'}}>{p.name}</div>
                    <div style={{fontSize:'12px', color:'#facc15'}}>{p.role} | {p.team}</div>
                    <button onClick={()=>window.open(`https://wa.me/${p.wa}`)} style={s.waBtn}><FaWhatsapp/> Chat</button>
                  </div>
                  {isAdmin && <FaTrash onClick={()=>remove(ref(db, `players/${p.name.replace(/\s/g, '_')}`))} style={{color:'#ef4444'}} />}
                </div>
                <div style={s.pStats}>
                  <div style={s.pStBox}><small>MAT</small><br/><b>{p.st.m}</b></div>
                  <div style={s.pStBox}><small>RUNS</small><br/><b>{p.st.r}</b></div>
                  <div style={s.pStBox}><small>WKTS</small><br/><b>{p.st.w}</b></div>
                  <div style={s.pStBox}><small>S/R</small><br/><b>{p.st.sr}</b></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddPlayer && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.flexBetween}><h3>Add Player</h3> <FaTimes onClick={()=>setShowAddPlayer(false)}/></div>
            <form onSubmit={addPlayer}>
              <input name="pname" placeholder="Name" style={s.input} required />
              <input name="prole" placeholder="Role (Batter/Bowler)" style={s.input} />
              <input name="pteam" placeholder="Team" style={s.input} />
              <input name="pwa" placeholder="WhatsApp" style={s.input} />
              <input name="pdp" placeholder="Image Link (URL)" style={s.input} />
              <div style={s.flexGap}>
                <input name="pm" placeholder="Matches" type="number" style={s.input} />
                <input name="pr" placeholder="Runs" type="number" style={s.input} />
              </div>
              <button type="submit" style={s.goldBtn}>SAVE PLAYER</button>
            </form>
          </div>
        </div>
      )}

      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={()=>setShowAuth(false)}>
          <input type="password" placeholder="PIN" style={s.pinInput} onChange={(e)=>e.target.value==="6545" && setIsAdmin(true)} />
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  tabsRow: { display:'flex', gap:'10px', padding:'10px', background:'#0f172a' },
  tab: { flex:1, padding:'10px', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', border:'1px solid #334155' },
  mainScore: { fontSize:'50px', fontWeight:'bold', color:'#facc15' },
  overInfo: { fontSize:'16px', opacity:0.8 },
  ballRow: { display:'flex', gap:'5px', justifyContent:'center', marginTop:'15px', flexWrap:'wrap' },
  ball: { width:'28px', height:'28px', borderRadius:'50%', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'20px' },
  numBtn: { padding:'15px', background:'white', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none' },
  exBtn: { padding:'15px', background:'#fb923c', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  nbBtn: { padding:'15px', background:'#8b5cf6', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'15px', background:'#ef4444', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  delBtn: { padding:'15px', background:'#475569', color:'white', borderRadius:'10px', fontWeight:'bold', border:'none' },
  goldBtn: { width:'100%', padding:'15px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'10px' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'#1e293b', padding:'20px', borderRadius:'20px', width:'85%' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#0f172a', border:'1px solid #334155', color:'white', borderRadius:'8px', boxSizing:'border-box' },
  flexGap: { display:'flex', gap:'10px' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:100 },
  
  // PLAYER CARD STYLES
  addBtn: { width:'100%', padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', marginBottom:'15px' },
  pCard: { background:'#0f172a', padding:'15px', borderRadius:'15px', marginBottom:'10px', border:'1px solid #1e293b' },
  pTop: { display:'flex', gap:'15px', alignItems:'center' },
  pDp: { width:'60px', height:'60px', borderRadius:'50%', border:'2px solid #facc15', objectFit:'cover' },
  waBtn: { background:'#25D366', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px', fontSize:'12px', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px' },
  pStats: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', marginTop:'15px', borderTop:'1px solid #1e293b', paddingTop:'10px' },
  pStBox: { textAlign:'center' }
};
