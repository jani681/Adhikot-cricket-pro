import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function AdhiKotFinalApp() {
  const [match, setMatch] = useState<any>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [anim, setAnim] = useState("");

  // Temporary Setup State
  const [tempData, setTempData] = useState({
    tA: "", tB: "", tALogo: "", tBLogo: "", adminDP: "", pA: "", pB: ""
  });

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      setMatch(snap.val());
    });
  }, []);

  const handleImage = (e: any, key: string) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempData({ ...tempData, [key]: reader.result as string });
    };
    if (file) reader.readAsDataURL(file);
  };

  const startMatch = () => {
    if (!tempData.tA || !tempData.tB) return alert("Teams ke naam likhen!");
    
    const parse = (s: string) => s.split(',').map(name => ({
      name: name.trim(), status: "Yet to Bat", runs: 0, balls: 0
    }));

    const newMatch = {
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1,
      teamA: tempData.tA, teamB: tempData.tB,
      teamALogo: tempData.tALogo || "https://via.placeholder.com/50",
      teamBLogo: tempData.tBLogo || "https://via.placeholder.com/50",
      adminDP: tempData.adminDP || "https://i.ibb.co/vzYyLz7/touqeer.jpg",
      teamAPlayers: parse(tempData.pA || "Player 1, Player 2"),
      teamBPlayers: parse(tempData.pB || "Player 1, Player 2"),
      striker: { name: "Select Striker", runs: 0, balls: 0 },
      nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0 },
      bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0 },
      battingTeam: 'A'
    };

    set(ref(db, 'liveMatch'), newMatch);
    setSetupMode(false);
  };

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    if (type === 'run') {
      m.score += runs; m.balls += 1;
      m.striker.runs += runs; m.striker.balls += 1;
      if (runs === 4) setAnim("🔥 FOUR");
      if (runs === 6) setAnim("🚀 SIX");
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1 + runs;
      setAnim(type.toUpperCase());
    }
    set(ref(db, 'liveMatch'), m);
    setTimeout(() => setAnim(""), 1500);
  };

  if (setupMode || !match) {
    return (
      <div style={setupContainer}>
        <h2 style={{color: '#f5cd11'}}>New Match Setup</h2>
        <div style={inputGroup}>
          <label>Admin Photo:</label>
          <input type="file" onChange={(e) => handleImage(e, 'adminDP')} />
          <input type="text" placeholder="Team A Name" onChange={e => setTempData({...tempData, tA: e.target.value})} />
          <input type="file" onChange={(e) => handleImage(e, 'tALogo')} />
          <textarea placeholder="Team A Players (Ali, Khan, Umar...)" onChange={e => setTempData({...tempData, pA: e.target.value})} />
        </div>
        <div style={inputGroup}>
          <input type="text" placeholder="Team B Name" onChange={e => setTempData({...tempData, tB: e.target.value})} />
          <input type="file" onChange={(e) => handleImage(e, 'tBLogo')} />
          <textarea placeholder="Team B Players (Jani, Rafi, Abid...)" onChange={e => setTempData({...tempData, pB: e.target.value})} />
        </div>
        <button onClick={startMatch} style={mainBtn}>START MATCH</button>
      </div>
    );
  }

  return (
    <div style={appContainer}>
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={match.adminDP} style={dpStyle} />
          <span style={{fontWeight:'bold', color:'#f5cd11'}}>ADHI KOT PRO</span>
        </div>
        <a href="https://wa.me/923015800630" style={waBtn}>WhatsApp</a>
      </div>

      <div style={scoreCard}>
        <div style={teamRow}>
          <div style={teamCell}><img src={match.teamALogo} style={miniLogo} /> {match.teamA}</div>
          <div style={teamCell}>{match.teamB} <img src={match.teamBLogo} style={miniLogo} /></div>
        </div>
        <h1 style={bigScore}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></h1>
        
        <div style={playerRow}>🏏 {match.striker.name}* <span>{match.striker.runs}({match.striker.balls})</span></div>
        <div style={playerRow}>🏏 {match.nonStriker.name} <span>{match.nonStriker.runs}({match.nonStriker.balls})</span></div>
      </div>

      <div style={btnGrid}>
        {[0,1,2,3,4,6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={numBtn}>{r}</button>)}
        <button onClick={() => handleBall(0, 'wd')} style={extraBtn}>WD</button>
        <button onClick={() => handleBall(0, 'nb')} style={extraBtn}>NB</button>
        <button onClick={() => setSetupMode(true)} style={resetBtn}>Reset Match</button>
      </div>

      {anim && <div style={overlay}>{anim}</div>}
    </div>
  );
}

// Styles
const setupContainer: any = { padding: '20px', background: '#0f172a', minHeight: '100vh', color: 'white' };
const inputGroup: any = { background: '#1e293b', padding: '15px', borderRadius: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' };
const appContainer: any = { background: '#0f172a', minHeight: '100vh', color: 'white' };
const header: any = { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderBottom: '2px solid #f5cd11' };
const dpStyle: any = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' };
const waBtn: any = { background: '#25D366', color: 'white', padding: '8px 15px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px' };
const scoreCard: any = { margin: '15px', padding: '20px', background: '#1e293b', borderRadius: '25px', border: '1px solid #334155' };
const teamRow: any = { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' };
const teamCell: any = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' };
const miniLogo: any = { width: '30px', height: '30px', borderRadius: '50%' };
const bigScore: any = { fontSize: '50px', textAlign: 'center', margin: '10px 0' };
const playerRow: any = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' };
const btnGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '15px' };
const numBtn: any = { padding: '20px', fontSize: '20px', borderRadius: '12px', border: 'none', background: 'white', fontWeight: 'bold' };
const extraBtn: any = { background: '#eab308', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const resetBtn: any = { gridColumn: 'span 2', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const mainBtn: any = { width: '100%', padding: '15px', background: '#f5cd11', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px' };
const overlay: any = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '50px', fontWeight: 'bold', color: '#f5cd11', zIndex: 100, textShadow: '2px 2px 10px black' };
