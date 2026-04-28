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
      setMatch(data);
    });

    onValue(ref(db, 'matchHistory'), (snap) => setHistory(snap.val() || {}));
    onValue(ref(db, 'appSettings/promo'), (snap) => setPromo(snap.val() || {}));
  }, []);

  const startNewMatchManual = () => {
    const newMatch = {
      lg: "Local Tournament",
      t1: "Team A", t2: "Team B",
      t1p: ["Player 1", "Player 2", "Player 3"],
      t2p: ["Player 4", "Player 5", "Player 6"],
      batTeam: "Team A", bowlTeam: "Team B",
      score: 0, wkts: 0, ov: 0, bl: 0, maxOv: 5,
      s1: {n: "Batsman 1", r: 0, b: 0, fours: 0, sixes: 0},
      s2: {n: "Batsman 2", r: 0, b: 0, fours: 0, sixes: 0},
      bwr: "Bowler 1", active: 1, status: "Live", innings: 1,
      bowlersDict: {"Bowler 1": {o: 0, r: 0, w: 0, b: 0}},
      battingCard: [], commentary: []
    };
    set(ref(db, 'liveMatch'), newMatch);
  };

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 3000); };

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || !isAdmin) return;
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;
    let bName = data.bwr || 'Unknown';
    if (!data.bowlersDict) data.bowlersDict = {};
    if (!data.bowlersDict[bName]) data.bowlersDict[bName] = { r: 0, w: 0, o: 0, b: 0 };
    let curBwr = data.bowlersDict[bName];

    if (type === 'normal') {
      data.score += runs; curBwr.r += runs;
      striker.r += runs; striker.b += 1;
      data.bl += 1; curBwr.b += 1;
    } else if (type === 'wd' || type === 'nb') {
      data.score += (1 + runs); curBwr.r += (1 + runs);
    }

    if (outType) {
        data.wkts += 1;
        if (outType !== 'Run Out') curBwr.w += 1;
        if (!data.battingCard) data.battingCard = [];
        data.battingCard.push({ n: striker.n, r: striker.r, b: striker.b, out: outType });
        if (data.wkts < 10) setTimeout(() => setSelModal(data.active === 1 ? 's1' : 's2'), 500);
    }

    if (runs % 2 !== 0 && type === 'normal') data.active = data.active === 1 ? 2 : 1;
    if (data.bl === 6) { data.ov += 1; data.bl = 0; curBwr.o += 1; curBwr.b = 0; data.active = data.active === 1 ? 2 : 1; setTimeout(() => setSelModal('bwr'), 600); }

    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };

  const rates = (() => {
    if(!match) return {crr: "0.00", rrr: "0.00"};
    const totalBalls = (match.ov * 6) + match.bl;
    const crr = totalBalls > 0 ? ((match.score / totalBalls) * 6).toFixed(2) : "0.00";
    return {crr};
  })();

  return (
    <div style={s.container}>
      {anim && <div style={s.bigAnim}>{anim}</div>}
      
      <div style={s.header}><div style={s.flexBetween}>
           <div style={{display:'flex', gap:'10px', alignItems:'center', cursor:'pointer'}} onClick={() => setShowAuth(true)}>
             <div style={s.avatar}>T</div>
             <div><b>Touqeer Iqbal</b><br/><small className="blink" style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN' : 'LIVE'}</small></div>
           </div>
           <FaHistory size={20} style={{cursor:'pointer', color:'#facc15'}} />
      </div></div>

      {(promo.text || promo.img) && (
        <div style={s.promoContainer}>
          {promo.img && <img src={promo.img} style={s.promoImg} />}
          {promo.text && <div style={s.marqueeWrap}><div className="marquee-content" style={s.promoText}>⭐ {promo.text} ⭐</div></div>}
        </div>
      )}

      {/* AGAR MATCH DATA NAHI HAI TO RESET BUTTON SHOW HOGA */}
      {!match && isAdmin && (
        <div style={{padding:'20px', textAlign:'center'}}>
            <p>No Live Match Found In Database</p>
            <button onClick={startNewMatchManual} style={s.goldBtn}>CREATE NEW MATCH STRUCTURE</button>
        </div>
      )}

      {match && (
        <div style={{padding:'10px'}}>
          <div style={s.card}>
            <div style={{fontSize:'12px', color: '#facc15'}}>{match.lg}</div>
            <div style={{fontSize:'18px', fontWeight:'bold'}}>{match.batTeam} vs {match.bowlTeam}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>{match.ov}.{match.bl} / {match.maxOv}</div>
            <div style={s.flexGapCenter}><div style={s.rateBadge}>CRR: {rates.crr}</div></div>
          </div>

          <div style={s.playerCard}>
             {[match.s1, match.s2].map((p, i) => (
                <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow}>
                   <span style={{flex:2}}>{p.n}{match.active === (i+1) ? '*' : ''}</span>
                   <span style={{flex:1, textAlign:'center'}}>{p.r}({p.b})</span>
                </div>
             ))}
          </div>

          {isAdmin && (
            <div style={s.adminGrid}>
               {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
               <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD</button>
               <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
               <button onClick={() => setShowPromoModal(true)} style={{gridColumn:'span 3', ...s.saveBtn}}>MANAGE ADS</button>
            </div>
          )}
        </div>
      )}

      {showAuth && !isAdmin && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <input type="password" placeholder="PIN" style={s.pinInput} autoFocus onChange={(e) => { if(e.target.value === "6545") { setIsAdmin(true); setShowAuth(false); }}} />
          </div>
        </div>
      )}

      {isAdmin && showPromoModal && (
        <div style={s.overlay} onClick={() => setShowPromoModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <input id="pText" placeholder="Promo Text" style={s.input} />
            <button onClick={() => { update(ref(db, 'appSettings/promo'), { text: document.getElementById('pText').value }); setShowPromoModal(false); }} style={s.goldBtn}>SAVE</button>
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
  overInfo: { fontSize:'18px', opacity:0.8 },
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
  input: { width:'100%', padding:'10px', marginBottom:'10px', background:'#0f172a', color:'white', border:'1px solid #334155' },
  goldBtn: { padding:'12px', background:'#facc15', color:'black', fontWeight:'bold', border:'none', borderRadius:'8px', width:'100%' },
  pinInput: { padding:'15px', background:'#0f172a', border:'2px solid #facc15', color:'white', borderRadius:'10px', textAlign:'center', width:'100%', boxSizing:'border-box' },
  flexBetween: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  flexGapCenter: { display:'flex', gap:'10px', justifyContent:'center', marginTop:'10px' },
  rateBadge: { background:'#1e293b', padding:'4px 10px', borderRadius:'5px', color:'#facc15', fontSize:'11px' },
  bigAnim: { position:'fixed', top:'40%', left:'50%', transform:'translateX(-50%)', background:'#facc15', color:'black', padding:'15px 30px', borderRadius:'50px', fontWeight:'bold', zIndex:6000 }
};
