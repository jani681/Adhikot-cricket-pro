import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaTrophy, FaCog, FaHistory, FaCommentDots, FaPaperPlane, FaGlobe, FaBullhorn, FaHome, FaUsers, FaChartLine, FaPlus } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProAdvanced() {
  // --- NEW STATES FOR NAVIGATION & MULTI-MATCH ---
  const [activeTab, setActiveTab] = useState('Home'); // Home, Live, Players, More
  const [matches, setMatches] = useState({}); // Stores all matches from /matches
  const [selectedMatchId, setSelectedMatchId] = useState(null); // Which match is open
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  // --- EXISTING STATES (STAY THE SAME) ---
  const [promo, setPromo] = useState({});
  const [anim, setAnim] = useState("");
  const [commInput, setCommInput] = useState("");
  const [showPromoModal, setShowPromoModal] = useState(false);

  useEffect(() => {
    // 1. Fetch Multi-Matches
    const matchesRef = ref(db, 'matches');
    onValue(matchesRef, (snap) => setMatches(snap.val() || {}));

    // 2. Fetch Promo
    onValue(ref(db, 'appSettings/promo'), (snap) => setPromo(snap.val() || {}));
  }, []);

  // --- HELPERS (STAY THE SAME) ---
  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };
  
  const currentMatch = useMemo(() => {
    return selectedMatchId ? matches[selectedMatchId] : null;
  }, [matches, selectedMatchId]);

  // --- SCORING LOGIC (STAY THE SAME - Just updated to use selectedMatchId) ---
  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!currentMatch || !isAdmin || !selectedMatchId) return;
    let data = { ...currentMatch };
    let striker = data.active === 1 ? data.s1 : data.s2;

    // Logic implementation remains identical to your previous code
    if (type === 'normal') {
      data.score = (data.score || 0) + runs;
      data.bl = (data.bl || 0) + 1;
      striker.r = (parseInt(striker.r) || 0) + runs;
      striker.b = (striker.b || 0) + 1;
    } 
    // ... (rest of your handleScore logic goes here)

    update(ref(db, `matches/${selectedMatchId}`), data);
  };

  const createNewMatch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newMatchKey = push(ref(db, 'matches')).key;
    const newMatchData = {
      id: newMatchKey,
      lg: fd.get('lg'), t1: fd.get('t1'), t2: fd.get('t2'),
      status: 'Live', score: 0, wkts: 0, ov: 0, bl: 0, maxOv: parseInt(fd.get('max')),
      batTeam: fd.get('t1'), bowlTeam: fd.get('t2'),
      s1: {n: 'Batsman 1', r: 0, b: 0}, s2: {n: 'Batsman 2', r: 0, b: 0}, active: 1,
      bwr: 'Bowler', bwr_r: 0, bwr_w: 0, bwr_o: 0,
      commentary: ["Match Created!"]
    };
    set(ref(db, `matches/${newMatchKey}`), newMatchData);
    setSelectedMatchId(newMatchKey);
    setActiveTab('Live');
  };

  // --- RENDER SECTIONS ---
  const renderHome = () => (
    <div style={{padding: '15px'}}>
      <h3 style={{color:'#facc15'}}><FaTrophy/> Active Matches</h3>
      {Object.values(matches).length === 0 ? (
        <div style={s.setupBox}>No matches live. {isAdmin && "Create one below!"}</div>
      ) : (
        Object.values(matches).map(m => (
          <div key={m.id} style={s.matchCard} onClick={() => { setSelectedMatchId(m.id); setActiveTab('Live'); }}>
            <div style={s.flexBetween}>
              <span>{m.t1} vs {m.t2}</span>
              <span style={{color: '#facc15'}}>{m.score}/{m.wkts} ({m.ov}.{m.bl})</span>
            </div>
            <div style={{fontSize: '10px', marginTop: '5px', opacity: 0.7}}>{m.lg} • {m.status}</div>
          </div>
        ))
      )}
      
      {isAdmin && (
        <form style={s.setupBox} onSubmit={createNewMatch}>
          <h4>+ Start New Match</h4>
          <input name="lg" placeholder="League Name" style={s.input} required />
          <div style={s.flexGap}><input name="t1" placeholder="Team A" style={s.input}/><input name="t2" placeholder="Team B" style={s.input}/></div>
          <input name="max" placeholder="Overs" type="number" style={s.input} required/>
          <button type="submit" style={s.goldBtn}>CREATE MATCH</button>
        </form>
      )}
    </div>
  );

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      {/* Header */}
      <div style={s.header}><div style={s.flexBetween}>
           <div style={s.flex} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Adhikot Cricket Pro</b><br/><small style={{color: '#22c55e'}}>V2.0 PRO</small></div>
           </div>
           <FaCog size={20} style={{opacity:0.5}} onClick={() => setShowAuth(true)} />
      </div></div>

      {/* Main Content Area */}
      <div style={{paddingBottom: '80px'}}>
        {activeTab === 'Home' && renderHome()}
        
        {activeTab === 'Live' && (
          selectedMatchId ? (
            <div style={{padding: '10px'}}>
               {/* APKA PURANA SCOREBOARD DESIGN YAHAN HAI */}
               <div style={s.card}>
                  <div style={{fontSize:'12px', color: '#facc15'}}>{currentMatch?.lg}</div>
                  <div style={s.mainScore}>{currentMatch?.score}/{currentMatch?.wkts}</div>
                  <div>Overs: {currentMatch?.ov}.{currentMatch?.bl} / {currentMatch?.maxOv}</div>
               </div>
               {/* Admin controls and commentary as before... */}
            </div>
          ) : (
            <div style={{textAlign:'center', padding:'50px'}}>Select a match from Home tab.</div>
          )
        )}

        {activeTab === 'Players' && (
          <div style={{padding: '20px', textAlign: 'center'}}>
            <h3>Player Directory</h3>
            <p style={{opacity: 0.6}}>Feature coming in next step (Step 2)...</p>
          </div>
        )}
      </div>

      {/* --- NEW BOTTOM NAVIGATION BAR --- */}
      <div style={s.bottomNav}>
        <div style={activeTab === 'Home' ? s.navItemActive : s.navItem} onClick={() => setActiveTab('Home')}>
          <FaHome size={20}/><span style={{fontSize: '10px'}}>Home</span>
        </div>
        <div style={activeTab === 'Live' ? s.navItemActive : s.navItem} onClick={() => setActiveTab('Live')}>
          <FaTrophy size={20}/><span style={{fontSize: '10px'}}>Live</span>
        </div>
        <div style={activeTab === 'Players' ? s.navItemActive : s.navItem} onClick={() => setActiveTab('Players')}>
          <FaUsers size={20}/><span style={{fontSize: '10px'}}>Players</span>
        </div>
        <div style={activeTab === 'More' ? s.navItemActive : s.navItem} onClick={() => setActiveTab('More')}>
          <FaChartLine size={20}/><span style={{fontSize: '10px'}}>Stats</span>
        </div>
      </div>

      {/* Auth Modal (Stay the same) */}
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
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  bottomNav: { position: 'fixed', bottom: 0, width: '100%', background: '#0f172a', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #1e293b', zIndex: 1000 },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5, color: 'white' },
  navItemActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1, color: '#facc15' },
  matchCard: { background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #334155' },
  setupBox: { padding:'20px', background:'#0f172a', borderRadius:'15px', marginTop: '20px' },
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#1e293b', border:'1px solid #334155', color:'white', borderRadius:'8px' },
  goldBtn: { width:'100%', padding:'12px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px' },
  flexBetween: { display:'flex', justifyContent:'space-between', alignItems: 'center' },
  flexGap: { display:'flex', gap:'10px' },
  avatar: { width:'35px', height:'35px', background:'#facc15', borderRadius:'50%', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  card: { background:'#0f172a', padding:'20px', borderRadius:'20px', textAlign:'center', margin:'10px', border:'1px solid #334155' },
  mainScore: { fontSize:'45px', fontWeight:'bold', color:'#facc15' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 },
  modal: { background:'#1e293b', width:'80%', padding:'20px', borderRadius:'20px' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', width:'100%' },
  bigAnim: { position:'fixed', top:'40%', width:'100%', textAlign:'center', fontSize:'40px', fontWeight:'bold', color:'#facc15', zIndex:9999, textShadow:'0 0 20px rgba(250,204,21,0.5)' }
};
