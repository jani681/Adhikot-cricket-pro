import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function AdhiKotCricketProV2() {
  const [match, setMatch] = useState<any>(null);
  const [setup, setSetup] = useState({
    tA: "", tB: "", tALogo: "", tBLogo: "", umpire: "", tossWinner: "", adminImg: "", pA: "", pB: ""
  });
  const [isSetupOpen, setIsSetupOpen] = useState(true);

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) {
        setMatch(snap.val());
        setIsSetupOpen(false);
      }
    });
  }, []);

  const handleImage = (e: any, key: string) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setSetup({ ...setup, [key]: reader.result as string });
    if (file) reader.readAsDataURL(file);
  };

  const startNewMatch = () => {
    if (!setup.tA || !setup.tB || !setup.umpire) return alert("Teams aur Umpire ka naam lazmi likhen!");
    
    const playersA = setup.pA.split(',').map(n => ({ name: n.trim(), runs: 0, balls: 0, status: "In" }));
    const playersB = setup.pB.split(',').map(n => ({ name: n.trim(), runs: 0, balls: 0, status: "In" }));

    const initialData = {
      adminName: "Touqeer Iqbal",
      adminDP: setup.adminImg || "",
      teamA: setup.tA, teamB: setup.tB,
      teamALogo: setup.tALogo, teamBLogo: setup.tBLogo,
      umpire: setup.umpire,
      toss: setup.tossWinner,
      score: 0, wickets: 0, balls: 0, overs: 0,
      striker: { name: playersA[0]?.name || "Batsman 1", runs: 0, balls: 0 },
      nonStriker: { name: playersA[1]?.name || "Batsman 2", runs: 0, balls: 0 },
      bowler: { name: "Select Bowler", overs: 0, runs: 0, wkts: 0 },
      playersA, playersB,
      currentInnings: setup.tossWinner === setup.tA ? 'A' : 'B'
    };

    set(ref(db, 'liveMatch'), initialData);
  };

  const updateScore = (runs: number, type: string) => {
    let m = { ...match };
    if (type === 'run') {
      m.score += runs; m.balls += 1;
      m.striker.runs += runs; m.striker.balls += 1;
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wd' || type === 'nb') {
      m.score += (1 + runs);
    } else if (type === 'wkt') {
      m.wickets += 1; m.balls += 1;
      m.striker = { name: "New Batsman", runs: 0, balls: 0 };
    }

    if (m.balls === 6) { m.overs += 1; m.balls = 0; }
    set(ref(db, 'liveMatch'), m);
  };

  if (isSetupOpen || !match) {
    return (
      <div style={sContainer}>
        <h2 style={{color: '#f5cd11'}}>Match Setup Dashboard</h2>
        <div style={sCard}>
          <input type="text" placeholder="Admin Name: Touqeer Iqbal" disabled style={sInput}/>
          <label>Admin Photo:</label> <input type="file" onChange={(e) => handleImage(e, 'adminImg')} />
          
          <hr />
          <input type="text" placeholder="Team A Name" onChange={e => setSetup({...setup, tA: e.target.value})} style={sInput}/>
          <input type="file" onChange={(e) => handleImage(e, 'tALogo')} />
          <textarea placeholder="Team A Players (Ali, Ahmed, Khan...)" onChange={e => setSetup({...setup, pA: e.target.value})} style={sInput} />
          
          <hr />
          <input type="text" placeholder="Team B Name" onChange={e => setSetup({...setup, tB: e.target.value})} style={sInput}/>
          <input type="file" onChange={(e) => handleImage(e, 'tBLogo')} />
          
          <hr />
          <input type="text" placeholder="Umpire Name" onChange={e => setSetup({...setup, umpire: e.target.value})} style={sInput}/>
          <input type="text" placeholder="Who won the toss?" onChange={e => setSetup({...setup, tossWinner: e.target.value})} style={sInput}/>
          
          <button onClick={startNewMatch} style={startBtn}>CREATE LIVE MATCH</button>
        </div>
      </div>
    );
  }

  return (
    <div style={appWrap}>
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={match.adminDP} style={adDP} alt="DP" />
          <div>
            <div style={{fontSize:'12px', color:'#f5cd11'}}>{match.adminName}</div>
            <div style={{fontWeight:'bold', fontSize:'14px'}}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href="https://wa.me/923015800630" style={waBtn}>WhatsApp</a>
      </div>

      <div style={scoreMain}>
        <div style={matchInfo}>
          <div style={tSide}><img src={match.teamALogo} style={tmL} /> {match.teamA}</div>
          <div style={{color:'#f5cd11', fontWeight:'bold'}}>VS</div>
          <div style={tSide}>{match.teamB} <img src={match.teamBLogo} style={tmL} /></div>
        </div>

        <div style={umpireRow}>Umpire: {match.umpire} | Toss: {match.toss}</div>

        <h1 style={bigScore}>{match.score}/{match.wickets} <small style={{fontSize:'20px'}}>({match.overs}.{match.balls})</small></h1>

        <div style={pSection}>
          <div style={pRow} onClick={() => { /* Player switch logic */ }}>🏏 {match.striker.name}* <span>{match.striker.runs}({match.striker.balls})</span></div>
          <div style={pRow}>🏏 {match.nonStriker.name} <span>{match.nonStriker.runs}({match.nonStriker.balls})</span></div>
          <div style={bowlerRow}>⚪ Bowler: {match.bowler.name} <span>{match.bowler.overs}ov-{match.bowler.runs}r</span></div>
        </div>
      </div>

      <div style={controlGrid}>
        {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => updateScore(n, 'run')} style={nBtn}>{n}</button>)}
        <button onClick={() => updateScore(0, 'wd')} style={extraBtn}>WD</button>
        <button onClick={() => updateScore(0, 'nb')} style={extraBtn}>NB</button>
        <button onClick={() => updateScore(0, 'wkt')} style={wktBtn}>WICKET</button>
        <button onClick={() => setIsSetupOpen(true)} style={resetBtn}>New Match Setup</button>
      </div>
    </div>
  );
}

// Styles
const sContainer: any = { background: '#0f172a', minHeight: '100vh', padding: '20px', color: 'white' };
const sCard: any = { background: '#1e293b', padding: '20px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '12px' };
const sInput: any = { padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' };
const startBtn: any = { background: '#f5cd11', color: '#000', padding: '15px', borderRadius: '10px', fontWeight: 'bold', border: 'none', marginTop: '10px' };
const appWrap: any = { background: '#0f172a', minHeight: '100vh', color: 'white' };
const header: any = { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f5cd11', background: '#1e293b' };
const adDP: any = { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' };
const waBtn: any = { background: '#25D366', color: 'white', padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' };
const scoreMain: any = { margin: '15px', padding: '20px', background: '#1e293b', borderRadius: '30px', border: '1px solid #334155', textAlign: 'center' };
const matchInfo: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const tSide: any = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' };
const tmL: any = { width: '30px', height: '30px', borderRadius: '50%' };
const umpireRow: any = { fontSize: '12px', color: '#94a3b8', marginBottom: '15px' };
const bigScore: any = { fontSize: '65px', margin: '10px 0' };
const pSection: any = { textAlign: 'left', marginTop: '20px' };
const pRow: any = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' };
const bowlerRow: any = { marginTop: '15px', color: '#60a5fa', display: 'flex', justifyContent: 'space-between' };
const controlGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '15px' };
const nBtn: any = { padding: '20px', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', border: 'none', background: '#fff', color: '#0f172a' };
const extraBtn: any = { background: '#eab308', borderRadius: '12px', border: 'none', fontWeight: 'bold' };
const wktBtn: any = { gridColumn: 'span 2', background: '#ef4444', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: 'bold' };
const resetBtn: any = { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', marginTop: '10px' };
