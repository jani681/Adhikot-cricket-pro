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
    teamA: "Team A", teamB: "Team B", tossWinner: "", tossDecision: "",
    striker: { name: "Select Striker", runs: 0, balls: 0, phone: "" },
    nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0, phone: "" },
    bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0, phone: "" },
    teamAPlayers: [] as any[], teamBPlayers: [] as any[],
    battingTeam: 'A', adminName: "Touqeer Iqbal", adminWA: "923015800630"
  });

  const [showAnim, setShowAnim] = useState("");
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => { if (snap.val()) setMatch(snap.val()); });
  }, []);

  const updateDB = (data: any) => set(ref(db, 'liveMatch'), data);

  const triggerAnim = (text: string) => {
    setShowAnim(text);
    setTimeout(() => setShowAnim(""), 2000);
  };

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    if (m.striker.name.includes("Select")) return alert("Pehle Batsman select karen!");

    if (type === 'run') {
      m.score += runs; m.balls += 1;
      m.striker.runs += runs; m.striker.balls += 1;
      m.bowler.runs += runs; m.bowler.balls += 1;
      if (runs === 4) triggerAnim("🔥 FOUR!");
      if (runs === 6) triggerAnim("🚀 SIXER!");
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wkt') {
      triggerAnim("☝️ OUT!");
      m.wickets += 1; m.balls += 1; m.bowler.wkts += 1;
      
      const totalPlayers = m.battingTeam === 'A' ? m.teamAPlayers.length : m.teamBPlayers.length;
      if (m.wickets >= totalPlayers - 1) {
        handleInningsEnd(m);
        return;
      }
      updateDB(m);
      return selectPlayer('striker', m);
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1; m.bowler.runs += 1;
    }

    if (m.balls === 6) {
      m.overs += 1; m.balls = 0; m.bowler.overs += 1; m.bowler.balls = 0;
      updateDB(m);
      triggerAnim("OVER END");
      return selectPlayer('bowler', m);
    }
    
    // Check if target chased
    if (m.innings === 2 && m.score >= m.target) {
        alert(`${m.battingTeam === 'A' ? m.teamA : m.teamB} WON!`);
        return;
    }
    updateDB(m);
  };

  const handleInningsEnd = (m: any) => {
    alert("Innings Ended!");
    const firstInningsScore = m.score;
    m.target = firstInningsScore + 1;
    m.score = 0; m.wickets = 0; m.balls = 0; m.overs = 0;
    m.innings = 2;
    m.battingTeam = m.battingTeam === 'A' ? 'B' : 'A';
    m.striker = { name: "Select Striker", runs: 0, balls: 0, phone: "" };
    m.nonStriker = { name: "Select Non-Striker", runs: 0, balls: 0, phone: "" };
    m.bowler = { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0, phone: "" };
    updateDB(m);
  };

  const selectPlayer = (role: any, currentMatch = match) => {
    const players = role === 'bowler' 
      ? (currentMatch.battingTeam === 'A' ? currentMatch.teamBPlayers : currentMatch.teamAPlayers)
      : (currentMatch.battingTeam === 'A' ? currentMatch.teamAPlayers : currentMatch.teamBPlayers);

    const usedNames = [currentMatch.striker.name, currentMatch.nonStriker.name];
    const available = players.filter(p => !usedNames.includes(p.name));

    const listString = available.map((p, i) => `${i+1}: ${p.name}`).join('\n');
    const idx = prompt(`Available Players:\n${listString}\n\nNumber likhen:`);
    
    if (idx && available[parseInt(idx)-1]) {
      const p = available[parseInt(idx)-1];
      let m = { ...currentMatch };
      if (role === 'striker') m.striker = { name: p.name, runs: 0, balls: 0, phone: p.phone };
      if (role === 'nonStriker') m.nonStriker = { name: p.name, runs: 0, balls: 0, phone: p.phone };
      if (role === 'bowler') m.bowler = { name: p.name, overs: 0, balls: 0, runs: 0, wkts: 0, phone: p.phone };
      updateDB(m);
    }
  };

  const setupMatch = () => {
    const tA = prompt("Team A Name:") || "Team A";
    const pA = prompt("Team A Players (Name:Phone, Name:Phone):") || "";
    const tB = prompt("Team B Name:") || "Team B";
    const pB = prompt("Team B Players (Name:Phone):") || "";
    const winner = prompt(`Toss Winner (${tA}/${tB}):`) || tA;
    const dec = prompt("Decision (Bat/Ball):") || "Bat";

    const parse = (s: string) => s.split(',').map(x => ({ name: x.split(':')[0].trim(), phone: x.split(':')[1]?.trim() || "" }));

    updateDB({
      ...match, teamA: tA, teamB: tB, teamAPlayers: parse(pA), teamBPlayers: parse(pB),
      tossWinner: winner, tossDecision: dec, score: 0, wickets: 0, balls: 0, overs: 0, innings: 1, target: 0,
      battingTeam: (winner === tA && dec === 'Bat') || (winner === tB && dec === 'Ball') ? 'A' : 'B'
    });
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Animation Overlay */}
      {showAnim && <div style={animStyle}>{showAnim}</div>}

      {/* Admin Header */}
      <div style={{ background: '#1e293b', padding: '15px', borderBottom: '2px solid #f5cd11', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="https://via.placeholder.com/40" style={{ borderRadius: '50%', border: '2px solid #f5cd11' }} alt="Admin" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{match.adminName}</div>
            <div style={{ fontWeight: 'bold', color: '#f5cd11' }}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.adminWA}`} style={{ background: '#25D366', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', textDecoration: 'none', color: 'white' }}>WhatsApp</a>
      </div>

      <div style={{ padding: '15px' }}>
        {/* Scorecard */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '20px', padding: '20px', border: '1px solid #475569', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f5cd11', fontSize: '13px', cursor: 'pointer' }} onClick={() => setShowList(!showList)}>
            <span>{match.teamA} vs {match.teamB} (Tap for List)</span>
            <span>{match.tossWinner} chose to {match.tossDecision}</span>
          </div>

          <div style={{ fontSize: '60px', fontWeight: '900', margin: '15px 0' }}>
            {match.score}/{match.wickets} <span style={{ fontSize: '20px', color: '#94a3b8' }}>({match.overs}.{match.balls})</span>
          </div>

          {match.innings === 2 && (
            <div style={{ background: 'rgba(245, 205, 17, 0.1)', padding: '10px', borderRadius: '10px', marginBottom: '15px', color: '#f5cd11', fontWeight: 'bold' }}>
              Target: {match.target} | Need {match.target - match.score} from {60 - (match.overs * 6 + match.balls)} balls
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
            <div onClick={() => selectPlayer('striker')} style={playerRow}>
              <span>🏏 {match.striker.name}*</span>
              <span>{match.striker.runs}({match.striker.balls})</span>
            </div>
            <div onClick={() => selectPlayer('nonStriker')} style={{ ...playerRow, color: '#94a3b8' }}>
              <span>🏏 {match.nonStriker.name}</span>
              <span>{match.nonStriker.runs}({match.nonStriker.balls})</span>
            </div>
          </div>

          <div onClick={() => selectPlayer('bowler')} style={bowlerCard}>
            <span>⚪ {match.bowler.name}</span>
            <span>{match.bowler.overs}.{match.bowler.balls}-{match.bowler.runs}R-{match.bowler.wkts}W</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={btnStyle}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wkt')} style={{ ...btnStyle, background: '#ef4444', color: 'white' }}>WKT</button>
          <button onClick={() => handleBall(0, 'wd')} style={{ ...btnStyle, background: '#eab308' }}>WD</button>
        </div>

        <button onClick={setupMatch} style={setupBtn}>New Match Setup</button>
      </div>

      {/* Players List Modal */}
      {showList && (
        <div style={modalStyle}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '20px', width: '80%' }}>
            <h3 style={{ color: '#f5cd11' }}>Players List</h3>
            {[...match.teamAPlayers, ...match.teamBPlayers].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                <span>{p.name}</span>
                <a href={`https://wa.me/${p.phone}`} style={{ color: '#25D366' }}>💬</a>
              </div>
            ))}
            <button onClick={() => setShowList(false)} style={{ marginTop: '15px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#f5cd11' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const playerRow: any = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer', fontSize: '15px' };
const bowlerCard: any = { marginTop: '15px', background: 'rgba(96, 165, 250, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', color: '#60a5fa', cursor: 'pointer' };
const btnStyle: any = { padding: '20px 5px', fontSize: '22px', fontWeight: 'bold', border: 'none', borderRadius: '12px', background: 'white', color: '#1e293b' };
const setupBtn: any = { width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', border: 'none', background: '#f5cd11', fontWeight: 'bold', color: '#0f172a' };
const animStyle: any = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '50px', fontWeight: 'bold', color: '#f5cd11', zIndex: 100, textShadow: '0 0 20px rgba(0,0,0,0.5)', animation: 'bounce 0.5s infinite alternate' };
const modalStyle: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 };
