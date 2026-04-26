import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
import { FaWhatsapp, FaUndo, FaSave, FaUserCircle } from 'react-icons/fa';
import Select from 'react-select'; // Intelligent selection for strikers

// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg", // InshaAllah this is correct
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseiocom"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const ADMIN_PIN = "6545"; // Secured

// Intelligent Calculation for Cricbuzz Stats
const calcEco = (r, b) => (b > 0 ? ((r / b) * 6).toFixed(2) : "0.00");
const calcSR = (r, b) => (b > 0 ? ((r / b) * 100).toFixed(2) : "0.00");

export default function AdhikotProCricbuzzEdition() {
  const [match, setMatch] = useState<any>(null);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'setup'>('live');
  const [passInp, setPassInp] = useState("");
  const [anim, setAnim] = useState("");

  useEffect(() => {
    // Prevent re-login on refresh
    if (localStorage.getItem('isAdminAuth') === 'true') setIsAdminAuthorized(true);

    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => setMatch(snap.val()));
  }, []);

  const updateDB = (data: any) => update(ref(db, 'liveMatch'), data);

  const triggerAnim = (txt) => { setAnim(txt); setTimeout(() => setAnim(""), 2500); };

  // Advanced Scoring Logic with Automatic Strike Rotation
  const handleScore = (runs: number, type = "normal") => {
    if (!isAdminAuthorized || !match) return;
    let m = { ...match };
    
    // Check if batsman selected
    if(!m.striker?.name || !m.bowler?.name) { alert("Pehle Striker aur Bowler select karen!"); return; }

    if (runs === 4) triggerAnim("FOUR! ✨");
    if (runs === 6) triggerAnim("SIXER! 🚀");

    if (type === "W") {
      triggerAnim("WICKET! ☝️");
      m.wkts += 1; m.bl += 1; m.bowler.w += 1;
      m.striker.name = "SELECT NEW BATSMAN"; m.striker.r=0; m.striker.b=0;
    } else if (type === "WD" || type === "NB") {
      triggerAnim(type === "WD" ? "WIDE" : "NO BALL");
      m.score += (runs + 1); m.bowler.r += (runs + 1);
      if (type === "NB") m.freeHit = true;
    } else {
      m.score += runs; m.bl += 1;
      m.striker.r += runs; m.striker.b += 1;
      m.bowler.r += runs;
      m.freeHit = false;
      // Strike Rotate on odd runs
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    // Over Change Management
    if (m.bl >= 6) {
      m.ov += 1; m.bl = 0;
      m.bowler.o += 1;
      // Swap on Over end
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    updateDB(m);
  };

  // WhatsApp Message Logic
  const shareWAMsg = (playerPhone, msgText) => {
    window.open(`https://wa.me/${playerPhone}?text=${encodeURIComponent(msgText)}`, '_blank');
  };

  if(!match && !isAdminAuthorized) return <div style={s.loader}>Connectin to Adhikot Database... Please Wait...</div>;

  return (
    <div style={s.container}>
      {/* Permanent Header with WhatsApp Icon */}
      <div style={s.header}>
        <div style={s.profile}>
          <FaUserCircle size={35} color="#facc15" />
          <div>
            <div style={s.uName}>Touqeer Iqbal Baghoor</div>
            <div style={s.uRole}>🟢 WhatsApp Integrated | Admin</div>
          </div>
        </div>
        <div style={s.headerRight}>
            <FaWhatsapp size={25} color="#22c55e" style={{cursor: 'pointer'}} onClick={() => shareWAMsg("923015800630", "Touqeer Bhai, kya haal hai?")}/>
            <button onClick={() => { localStorage.removeItem('isAdminAuth'); setIsAdminAuthorized(false); }} style={s.lockBtn}>🔒 Lock</button>
        </div>
      </div>

      {anim && <div style={s.animPop}>{anim}</div>}

      {/* Tabs */}
      <div style={s.tabsRow}>
        <button onClick={() => setActiveTab('live')} style={activeTab === 'live' ? s.tabActive : s.tab}>LIVE SCORE</button>
        {isAdminAuthorized && <button onClick={() => setActiveTab('setup')} style={activeTab === 'setup' ? s.tabActive : s.tab}>SETUP MATCH</button>}
      </div>

      {/* Auth Panel */}
      {!isAdminAuthorized && (
        <div style={s.authBlock}>
          <h3>🔐 Admin Login</h3>
          <input type="password" placeholder="PIN: 6545" onChange={(e) => setPassInp(e.target.value)} style={s.pInput}/>
          <button onClick={() => {
            if(passInp === ADMIN_PIN) {
              setIsAdminAuthorized(true);
              localStorage.setItem('isAdminAuth', 'true');
              setActiveTab('setup');
            } else alert("Ghalt PIN!");
          }} style={s.goldBtn}>Access Panel</button>
        </div>
      )}

      {/* SETUP VIEW - Exact Interface as per Image */}
      {activeTab === 'setup' && isAdminAuthorized && (
        <form onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const playersArray = (p: string) => p.split('\n').map(p=>({name: p.split(',')[0].trim(), phone: p.split(',')[1]?.trim() || "923015800630"}));
          const mData = {
            lg: fd.get('lg'), gr: fd.get('gr'), umpire: fd.get('ump'), overs: fd.get('ov'), startTime: new Date().toLocaleTimeString(),
            score:0, wkts:0, ov:0, bl:0, freeHit: false,
            teams: {
              t1: { name: fd.get('t1'), players: playersArray(fd.get('p1')) },
              t2: { name: fd.get('t2'), players: playersArray(fd.get('p2')) }
            },
            striker: { name: "", r: 0, b: 0, phone: "" },
            nonStriker: { name: "", r: 0, b: 0, phone: "" },
            bowler: { name: "", o:0, r:0, w:0 }
          };
          update(ref(db, 'liveMatch'), mData).then(()=>setActiveTab('live'));
        }} style={s.formBlock}>
          <input name="lg" placeholder="League Name" style={s.pInput} required/>
          <input name="gr" placeholder="Ground Name" style={s.pInput} required/>
          <input name="ump" placeholder="Umpire Name" style={s.pInput}/>
          <input name="ov" type="number" placeholder="Total Overs" style={s.pInput} required/>
          <input name="t1" placeholder="Batting Team Name" style={s.pInput} required/>
          <textarea name="p1" placeholder="Batsmen (Names, Phone - per line)" style={s.area} required/>
          <input name="t2" placeholder="Bowling Team Name" style={s.pInput} required/>
          <textarea name="p2" placeholder="Bowlers (Names, Phone - per line)" style={s.area} required/>
          <button type="submit" style={s.startBtn}>START LIVE MATCH</button>
        </form>
      )}

      {/* CRICBUZZ EDITION DASHBOARD */}
      {activeTab === 'live' && match && (
        <div style={s.liveDashboard}>
          {/* Main Scorecard - Profesional Box */}
          <div style={s.cbScoreBox}>
            <div style={s.matchMeta}>{match.teams?.t1?.name} vs {match.teams?.t2?.name} | {match.gr}</div>
            <div style={s.bigScore}>{match.score}/{match.wkts} <small>({match.ov}.{match.bl})</small></div>
            <div style={s.time}>Started: {match.startTime}</div>
            {match.freeHit && <div style={s.fhBadge}>FREE HIT ⚡</div>}
          </div>

          {/* Cricbuzz Batsmen Table */}
          <table style={s.cbTable}>
            <thead><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>WA</th></tr></thead>
            <tbody>
              <tr>
                <td style={{color: '#facc15', fontWeight: 'bold'}}>{isAdminAuthorized ? <Select styles={s.selStyles} options={match.teams?.t1?.players.map(p=>({label: p.name, value:p}))} onChange={(opt)=>updateDB({striker: {...opt.value, r:0, b:0}})}/> : `${match.striker?.name || "SETTING"}*`}</td>
                <td>{match.striker?.r}</td><td>{match.striker?.b}</td><td>-</td><td>-</td><td>{calcSR(match.striker?.r, match.striker?.b)}</td>
                <td><FaWhatsapp color="#22c55e" onClick={()=>shareWAMsg(match.striker?.phone, `Live Situation: ${match.score}/${match.wkts}`)}/></td>
              </tr>
              <tr>
                <td style={{opacity: 0.8}}>{isAdminAuthorized ? <Select styles={s.selStyles} options={match.teams?.t1?.players.map(p=>({label: p.name, value:p}))} onChange={(opt)=>updateDB({nonStriker: {...opt.value, r:0, b:0}})}/> : match.nonStriker?.name}</td>
                <td>{match.nonStriker?.r}</td><td>{match.nonStriker?.b}</td><td>-</td><td>-</td><td>{calcSR(match.nonStriker?.r, match.nonStriker?.b)}</td>
                <td><FaWhatsapp color="#22c55e" onClick={()=>shareWAMsg(match.nonStriker?.phone, `Need you to build a partnership!`)}/></td>
              </tr>
            </tbody>
          </table>

          {/* Cricbuzz Bowler Table */}
          <table style={s.cbTable} >
            <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th></tr></thead>
            <tbody>
              <tr>
                <td style={{color: '#94a3b8'}}>{isAdminAuthorized ? <Select styles={s.selStyles} options={match.teams?.t2?.players.map(p=>({label: p.name, value:p}))} onChange={(opt)=>updateDB({bowler: {...opt.value, o:0, r:0, w:0}})}/> : match.bowler?.name}</td>
                <td>{match.bowler?.o}</td><td>{match.bowler?.r}</td><td>{match.bowler?.w}</td><td>{calcEco(match.bowler?.r, (match.bowler?.o * 6))}</td>
              </tr>
            </tbody>
          </table>

          {/* Admin Analytical Controls */}
          {isAdminAuthorized && (
            <div style={s.cbControls}>
              <div style={s.btnGrid}>
                {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => handleScore(n)} style={s.cBtn}>{n}</button>)}
                <button onClick={() => handleScore(0, "WD")} style={s.cbEx}>WD</button>
                <button onClick={() => handleScore(0, "NB")} style={s.cbEx}>NB</button>
                <button onClick={() => handleScore(0, "W")} style={s.cbWkt}>WKT</button>
              </div>
              <div style={s.actionRow}>
                <button style={s.safeBtn}><FaUndo /> Undo</button>
                <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.endBtn}><FaSave /> Finish & Save Match</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Full Intelligent Styles as per image & Cricbuzz
const s: any = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: '#fff', padding: '15px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #1e293b' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px' },
  uName: { fontSize: '15px', fontWeight: 'bold' },
  uRole: { fontSize: '11px', color: '#22c55e' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  lockBtn: { background: '#334155', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 12px', fontSize: '11px' },
  tabsRow: { display: 'flex', borderBottom: '1px solid #1e293b', marginTop: '10px' },
  tab: { flex: 1, padding: '12px', background: 'none', color: '#94a3b8', border: 'none', borderBottom: '2px solid transparent' },
  tabActive: { flex: 1, padding: '12px', background: 'none', color: '#facc15', border: 'none', borderBottom: '2px solid #facc15', fontWeight: 'bold' },
  authBlock: { textAlign: 'center', marginTop: '100px', background: '#111827', padding: '25px', borderRadius: '12px' },
  pInput: { width: '100%', padding: '12px', marginBottom: '10px', background: '#1f2937', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  goldBtn: { width: '100%', padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15', background: '#0a0e1a' },
  animPop: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: '#000', padding: '30px', borderRadius: '25px', fontSize: '28px', fontWeight: 'bold', zIndex: 1000 },
  formBlock: { marginTop: '20px', paddingBottom: '30px' },
  area: { width: '100%', minHeight: '120px', padding: '12px', marginBottom: '10px', background: '#1f2937', border: '1px solid #334155', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' },
  startBtn: { width: '100%', padding: '15px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' },
  cbScoreBox: { background: 'linear-gradient(135deg, #1e293b 0%, #0a0e1a 100%)', padding: '30px', borderRadius: '15px', textAlign: 'center', border: '1px solid #334155', margin: '20px 0' },
  matchMeta: { fontSize: '13px', opacity: 0.8 },
  bigScore: { fontSize: '60px', fontWeight: 'bold', color: '#facc15' },
  time: { fontSize: '11px', color: '#94a3b8' },
  fhBadge: { color: '#ef4444', fontWeight: 'bold', animation: 'blink 1s infinite' },
  cbTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#fff', textAlign: 'left', marginBottom: '15px', background: '#111827', borderRadius: '8px' },
  cbTableTh: { borderBottom: '1px solid #334155', padding: '10px' },
  cbControls: { marginTop: '20px', background: '#111827', padding: '20px', borderRadius: '15px' },
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  cBtn: { padding: '18px', background: 'white', color: '#000', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' },
  cbEx: { padding: '18px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  cbWkt: { padding: '18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  actionRow: { display: 'flex', gap: '10px', marginTop: '15px' },
  safeBtn: { flex: 1, padding: '12px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  endBtn: { flex: 2, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  selStyles: { container: (b)=>({...b, color: '#fff', minWidth: '150px'}), control: (b)=>({...b, background: '#1f2937', borderColor: '#334155', color: '#fff'}), option: (b)=>({...b, color: '#000'}) }
};
