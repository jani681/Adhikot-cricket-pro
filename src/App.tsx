import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function AdhiKotCricketPro() {
  const [match, setMatch] = useState({
    score: 0, wickets: 0, balls: 0, overs: 0, target: 0, innings: 1,
    teamA: "Team A", teamB: "Team B",
    teamALogo: "https://via.placeholder.com/50", 
    teamBLogo: "https://via.placeholder.com/50",
    adminDP: "https://i.ibb.co/vzYyLz7/touqeer.jpg",
    striker: { name: "Select Striker", runs: 0, balls: 0 },
    nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0 },
    bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0 },
    teamAPlayers: [] as any[], teamBPlayers: [] as any[],
    battingTeam: 'A'
  });

  const [anim, setAnim] = useState("");
  const adminNumber = "923015800630"; // Aapka Fixed Number

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) setMatch(snap.val());
    });
  }, []);

  const updateDB = (data: any) => set(ref(db, 'liveMatch'), data);

  const deleteMatch = () => {
    if(window.confirm("Kya aap poora match delete karke naya setup karna chahte hain?")) {
      remove(ref(db, 'liveMatch'));
      window.location.reload();
    }
  };

  const handleBall = (runs: number, type: 'run' | 'wkt' | 'wd' | 'nb') => {
    let m = { ...match };
    if (m.striker.name.includes("Select")) return alert("Pehle Striker select karen!");

    if (type === 'run') {
      m.score += runs; m.balls += 1;
      m.striker.runs += runs; m.striker.balls += 1;
      m.bowler.runs += runs; m.bowler.balls += 1;
      if (runs === 4) setAnim("🔥 FOUR");
      if (runs === 6) setAnim("🚀 SIXER");
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wd') {
      m.score += 1 + runs; m.bowler.runs += 1 + runs;
      setAnim("↔️ WIDE");
    } else if (type === 'nb') {
      m.score += 1 + runs; m.bowler.runs += 1 + runs;
      setAnim("🆓 NO BALL - FREE HIT");
    } else if (type === 'wkt') {
      setAnim("☝️ OUT");
      m.wickets += 1; m.balls += 1; m.bowler.wkts += 1;
      // Status update logic here as per previous chat...
      m.striker = { name: "Select Striker", runs: 0, balls: 0 };
    }

    if (m.balls === 6) { m.overs += 1; m.balls = 0; setAnim("✅ OVER END"); }
    updateDB(m);
    setTimeout(() => setAnim(""), 2000);
  };

  const setupNewMatch = () => {
    const tA = prompt("Team A Name:") || "Team A";
    const logoA = prompt("Team A Logo URL (ImgBB link):") || match.teamALogo;
    const tB = prompt("Team B Name:") || "Team B";
    const logoB = prompt("Team B Logo URL:") || match.teamBLogo;
    const adminImg = prompt("Admin DP URL:", match.adminDP) || match.adminDP;

    updateDB({
      ...match, teamA: tA, teamB: tB, teamALogo: logoA, teamBLogo: logoB, adminDP: adminImg,
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1
    });
  };

  return (
    <div style={containerStyle}>
      {/* HEADER WITH REAL WHATSAPP LINK */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={match.adminDP} style={adminDPStyle} alt="Admin" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Admin: Touqeer Iqbal</div>
            <div style={brandStyle}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${adminNumber}`} target="_blank" rel="noopener noreferrer" style={waButtonStyle}>
          WhatsApp
        </a>
      </div>

      <div style={{ padding: '15px' }}>
        {/* SCORECARD */}
        <div style={cardStyle}>
          <div style={teamsHeader}>
            <div style={teamInfo}><img src={match.teamALogo} style={logoStyle} /> {match.teamA}</div>
            <div style={{color:'#f5cd11'}}>VS</div>
            <div style={teamInfo}>{match.teamB} <img src={match.teamBLogo} style={logoStyle} /></div>
          </div>

          <h1 style={scoreDisplay}>{match.score}/{match.wickets} <small style={overStyle}>({match.overs}.{match.balls})</small></h1>

          <div style={playerBox}>
            <div style={pRow}>🏏 {match.striker.name}* <span>{match.striker.runs}({match.striker.balls})</span></div>
            <div style={{...pRow, color:'#94a3b8'}}>🏏 {match.nonStriker.name} <span>{match.nonStriker.runs}({match.nonStriker.balls})</span></div>
          </div>
          
          <div style={bowlerBox}>
            <span>⚪ {match.bowler.name}</span>
            <span>{match.bowler.overs}.{match.bowler.balls}-{match.bowler.runs}R-{match.bowler.wkts}W</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={gridStyle}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={numBtn}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wd')} style={wdBtn}>WD</button>
          <button onClick={() => handleBall(0, 'nb')} style={nbBtn}>NB</button>
          <button onClick={() => handleBall(0, 'wkt')} style={wktBtn}>WICKET</button>
        </div>

        {/* ADMIN TOOLS */}
        <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
          <button onClick={setupNewMatch} style={setupBtn}>Match Setup</button>
          <button onClick={deleteMatch} style={deleteBtn}>Delete Match</button>
        </div>
      </div>

      {anim && <div style={animStyle}>{anim}</div>}
    </div>
  );
}

// CSS-in-JS Styles
const containerStyle: any = { background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Arial' };
const headerStyle: any = { background: '#1e293b', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f5cd11' };
const adminDPStyle: any = { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' };
const brandStyle: any = { fontWeight: 'bold', color: '#f5cd11', fontSize: '14px' };
const waButtonStyle: any = { background: '#25D366', color: 'white', padding: '8px 15px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '12px' };
const cardStyle: any = { background: '#1e293b', padding: '20px', borderRadius: '25px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const teamsHeader: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const teamInfo: any = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold' };
const logoStyle: any = { width: '30px', height: '30px', borderRadius: '50%', background: '#334155' };
const scoreDisplay: any = { fontSize: '50px', textAlign: 'center', margin: '10px 0' };
const overStyle: any = { fontSize: '18px', color: '#94a3b8' };
const pRow: any = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' };
const playerBox: any = { marginTop: '10px' };
const bowlerBox: any = { marginTop: '15px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', color: '#60a5fa' };
const gridStyle: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' };
const numBtn: any = { padding: '18px', fontSize: '20px', borderRadius: '12px', border: 'none', background: 'white', color: '#0f172a', fontWeight: 'bold' };
const wdBtn: any = { background: '#eab308', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const nbBtn: any = { background: '#f97316', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const wktBtn: any = { gridColumn: 'span 2', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px' };
const setupBtn: any = { flex: 1, padding: '15px', background: '#f5cd11', color: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const deleteBtn: any = { flex: 1, padding: '15px', background: '#334155', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const animStyle: any = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', fontWeight: 'bold', color: '#f5cd11', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '20px', zIndex: 1000, textAlign: 'center' };
