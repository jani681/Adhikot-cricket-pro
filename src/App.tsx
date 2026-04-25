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

export default function App() {
  const [match, setMatch] = useState({
    score: 0, wickets: 0, balls: 0, overs: 0, target: 0, innings: 1,
    teamA: "Team A", teamB: "Team B",
    teamALogo: "https://via.placeholder.com/50", teamBLogo: "https://via.placeholder.com/50",
    striker: { name: "Select Striker", runs: 0, balls: 0 },
    nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0 },
    bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0 },
    teamAPlayers: [] as any[], teamBPlayers: [] as any[],
    battingTeam: 'A', adminName: "Touqeer Iqbal", adminWA: "923015800630"
  });

  const [anim, setAnim] = useState("");
  const [modal, setModal] = useState({ show: false, team: 'A' });

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => { if (snap.val()) setMatch(snap.val()); });
  }, []);

  const updateDB = (data: any) => set(ref(db, 'liveMatch'), data);

  const triggerAnim = (text: string) => {
    setAnim(text);
    setTimeout(() => setAnim(""), 2000);
  };

  const selectPlayer = (role: 'striker' | 'nonStriker' | 'bowler') => {
    const isBowler = role === 'bowler';
    const players = isBowler 
      ? (match.battingTeam === 'A' ? match.teamBPlayers : match.teamAPlayers)
      : (match.battingTeam === 'A' ? match.teamAPlayers : match.teamBPlayers);

    const available = isBowler ? players : players.filter(p => p.status === "Yet to Bat");
    const list = available.map((p, i) => `${i + 1}: ${p.name}`).join('\n');
    const idx = prompt(`Select ${role.toUpperCase()}:\n${list}`);
    
    if (idx && available[parseInt(idx) - 1]) {
      const p = available[parseInt(idx) - 1];
      let m = { ...match };
      if (!isBowler) {
        const teamKey = m.battingTeam === 'A' ? 'teamAPlayers' : 'teamBPlayers';
        m[teamKey] = m[teamKey].map((pl: any) => pl.name === p.name ? { ...pl, status: "Batting" } : pl);
        m[role] = { name: p.name, runs: 0, balls: 0, phone: p.phone };
      } else {
        m.bowler = { name: p.name, overs: 0, balls: 0, runs: 0, wkts: 0, phone: p.phone };
      }
      updateDB(m);
    }
  };

  const handleBall = (runs: number, type: 'run' | 'wkt' | 'wd' | 'nb') => {
    let m = { ...match };
    if (m.striker.name.includes("Select")) return alert("Pehle Batsman select karen!");

    if (type === 'run') {
      m.score += runs; m.balls += 1;
      m.striker.runs += runs; m.striker.balls += 1;
      m.bowler.runs += runs; m.bowler.balls += 1;
      if (runs === 4) triggerAnim("🔥 FOUR");
      if (runs === 6) triggerAnim("🚀 SIX");
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1 + runs; // Extra + runs if any
      m.bowler.runs += 1 + runs;
      triggerAnim(type === 'wd' ? "WIDE" : "NO BALL");
    } else if (type === 'wkt') {
      triggerAnim("☝️ OUT");
      m.wickets += 1; m.balls += 1; m.bowler.wkts += 1;
      const teamKey = m.battingTeam === 'A' ? 'teamAPlayers' : 'teamBPlayers';
      m[teamKey] = m[teamKey].map((p: any) => p.name === m.striker.name ? { ...p, status: "Out", runs: m.striker.runs, balls: m.striker.balls } : p);
      
      if (m.wickets >= m[teamKey].length - 1) {
          alert("Innings Over!");
          // Switch logic...
      } else {
          m.striker = { name: "Select Striker", runs: 0, balls: 0 };
          updateDB(m);
          return selectPlayer('striker');
      }
    }

    if (m.balls === 6) {
      m.overs += 1; m.balls = 0; m.bowler.overs += 1;
      updateDB(m);
      return selectPlayer('bowler');
    }
    updateDB(m);
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {/* PERSISTENT HEADER */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="https://i.ibb.co/vzYyLz7/touqeer.jpg" style={dpStyle} alt="Admin" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Touqeer Iqbal</div>
            <div style={{ fontWeight: 'bold', color: '#f5cd11', fontSize: '14px' }}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.adminWA}`} target="_blank" rel="noreferrer" style={waBtn}>
          <span style={{marginRight: '5px'}}>💬</span> WhatsApp
        </a>
      </div>

      <div style={{ padding: '15px' }}>
        <div style={scoreCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div onClick={() => setModal({show: true, team: 'A'})} style={teamBox}>
               <img src={match.teamALogo} style={logoStyle} alt="T1" />
               <small>{match.teamA}</small>
            </div>
            <span style={{color: '#f5cd11', fontWeight:'900'}}>VS</span>
            <div onClick={() => setModal({show: true, team: 'B'})} style={teamBox}>
               <img src={match.teamBLogo} style={logoStyle} alt="T2" />
               <small>{match.teamB}</small>
            </div>
          </div>
          
          <h1 style={{ fontSize: '55px', textAlign: 'center', margin: '15px 0' }}>
            {match.score}/{match.wickets} <small style={{fontSize:'16px', color:'#94a3b8'}}>({match.overs}.{match.balls})</small>
          </h1>

          <div style={batsmanSection}>
            <div onClick={() => selectPlayer('striker')} style={pRow}>🏏 {match.striker.name}* <span>{match.striker.runs}({match.striker.balls})</span></div>
            <div onClick={() => selectPlayer('nonStriker')} style={{...pRow, color:'#94a3b8'}}>🏏 {match.nonStriker.name} <span>{match.nonStriker.runs}({match.nonStriker.balls})</span></div>
          </div>

          <div onClick={() => selectPlayer('bowler')} style={bowlerSection}>
            <span>⚪ {match.bowler.name}</span>
            <span>{match.bowler.overs}.{match.bowler.balls}-{match.bowler.runs}R-{match.bowler.wkts}W</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={controlGrid}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={btn}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wd')} style={{...btn, background:'#eab308'}}>WD</button>
          <button onClick={() => handleBall(0, 'nb')} style={{...btn, background:'#f97316'}}>NB</button>
          <button onClick={() => handleBall(0, 'wkt')} style={{...btn, background:'#ef4444', color:'white', gridColumn: 'span 2'}}>WICKET</button>
        </div>
      </div>

      {anim && <div style={animStyle}>{anim}</div>}
    </div>
  );
}

// Styles
const headerStyle: any = { background: '#1e293b', padding: '12px 15px', borderBottom: '2px solid #f5cd11', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 };
const dpStyle: any = { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' };
const waBtn: any = { background: '#25D366', color: 'white', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center' };
const scoreCard: any = { background: '#1e293b', padding: '20px', borderRadius: '25px', border: '1px solid #334155' };
const teamBox: any = { textAlign: 'center', cursor: 'pointer' };
const logoStyle: any = { width: '45px', height: '45px', borderRadius: '50%', marginBottom: '5px', border: '1px solid #444' };
const pRow: any = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', cursor: 'pointer' };
const batsmanSection: any = { marginTop: '10px' };
const bowlerSection: any = { marginTop: '15px', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', color: '#60a5fa', cursor: 'pointer' };
const controlGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' };
const btn: any = { padding: '15px 5px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '12px', background: 'white', color: '#1e293b' };
const animStyle: any = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: '900', color: '#f5cd11', zIndex: 500, textShadow: '2px 2px 10px black' };
