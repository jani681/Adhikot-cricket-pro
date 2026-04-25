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
    score: 0, wickets: 0, balls: 0, overs: 0,
    teamA: "Team A", teamB: "Team B",
    tossWinner: "", tossDecision: "",
    striker: { name: "Select Striker", runs: 0, balls: 0, phone: "" },
    nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0, phone: "" },
    bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0, phone: "" },
    teamAPlayers: [] as {name: string, phone: string}[],
    teamBPlayers: [] as {name: string, phone: string}[],
    battingTeam: 'A'
  });

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) setMatch(snap.val());
    });
  }, []);

  const updateDB = (data: any) => set(ref(db, 'liveMatch'), data);

  const selectPlayer = (role: 'striker' | 'nonStriker' | 'bowler') => {
    const players = role === 'bowler' 
      ? (match.battingTeam === 'A' ? match.teamBPlayers : match.teamAPlayers)
      : (match.battingTeam === 'A' ? match.teamAPlayers : match.teamBPlayers);

    if (players.length === 0) return alert("Pehle Setup mein players aur numbers add karen!");
    
    const listString = players.map((p, i) => `${i+1}: ${p.name}`).join('\n');
    const index = prompt(`Players List:\n${listString}\n\nPlayer ka Number (1, 2, 3...) likhen:`);
    
    if (index && players[parseInt(index)-1]) {
      const selected = players[parseInt(index)-1];
      let m = { ...match };
      if (role === 'striker') m.striker = { name: selected.name, runs: 0, balls: 0, phone: selected.phone };
      if (role === 'nonStriker') m.nonStriker = { name: selected.name, runs: 0, balls: 0, phone: selected.phone };
      if (role === 'bowler') m.bowler = { name: selected.name, overs: 0, balls: 0, runs: 0, wkts: 0, phone: selected.phone };
      updateDB(m);
    }
  };

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    if (m.striker.name.includes("Select")) return alert("Pehle Batsman select karen!");

    if (type === 'run') {
      m.score += runs; m.balls += 1;
      m.striker.runs += runs; m.striker.balls += 1;
      m.bowler.runs += runs; m.bowler.balls += 1;
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wkt') {
      m.wickets += 1; m.balls += 1; m.bowler.wkts += 1;
      updateDB(m);
      return selectPlayer('striker');
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1; m.bowler.runs += 1;
    }

    if (m.balls === 6) {
      m.overs += 1; m.balls = 0; m.bowler.overs += 1; m.bowler.balls = 0;
      updateDB(m);
      alert("Over End! Naya Bowler select karen.");
      return selectPlayer('bowler');
    }
    updateDB(m);
  };

  const setupFullMatch = () => {
    const tA = prompt("Team A Name:") || "Team A";
    const pAInput = prompt("Team A Players & Numbers (e.g., Ali:92300, Khan:92301):") || "";
    const tB = prompt("Team B Name:") || "Team B";
    const pBInput = prompt("Team B Players & Numbers (e.g., Jani:92302, Rafi:92303):") || "";
    
    const parse = (str: string) => str.split(',').map(item => {
      const [name, phone] = item.split(':');
      return { name: name?.trim() || "Player", phone: phone?.trim() || "" };
    });

    const winner = prompt(`Toss kisne jeeta? (${tA} ya ${tB})`) || tA;
    const decision = prompt("Faisla kya kiya? (Bat ya Ball)") || "Bat";

    updateDB({
      ...match,
      teamA: tA, teamB: tB,
      teamAPlayers: parse(pAInput),
      teamBPlayers: parse(pBInput),
      tossWinner: winner, tossDecision: decision,
      score: 0, wickets: 0, balls: 0, overs: 0,
      striker: { name: "Select Striker", runs: 0, balls: 0, phone: "" },
      nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0, phone: "" },
      bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0, phone: "" }
    });
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white', padding: '15px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#f5cd11', margin: 0 }}>ADHI KOT CRICKET PRO</h2>
        {match.tossWinner && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
            🪙 {match.tossWinner} won toss & elected to {match.tossDecision}
          </div>
        )}
      </header>

      <div style={{ background: '#1e293b', borderRadius: '15px', padding: '15px', border: '1px solid #475569', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f5cd11', fontSize: '14px', fontWeight: 'bold' }}>
          <span>{match.teamA} vs {match.teamB}</span>
          <span style={{ color: '#ef4444' }}>● LIVE</span>
        </div>
        
        <div style={{ fontSize: '55px', fontWeight: 'bold', margin: '10px 0' }}>
          {match.score}/{match.wickets} 
          <span style={{ fontSize: '20px', color: '#94a3b8', marginLeft: '10px' }}>({match.overs}.{match.balls})</span>
        </div>

        {/* Batsmen Section */}
        <div style={{ borderTop: '1px solid #475569', paddingTop: '10px' }}>
          <div onClick={() => selectPlayer('striker')} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer' }}>
            <span>🏏 {match.striker.name}*</span>
            <span>{match.striker.runs}({match.striker.balls}) <small style={{color:'#60a5fa'}}>SR: {(match.striker.balls > 0 ? (match.striker.runs/match.striker.balls*100).toFixed(1) : "0")}</small></span>
          </div>
          <div onClick={() => selectPlayer('nonStriker')} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#94a3b8', cursor: 'pointer' }}>
            <span>🏏 {match.nonStriker.name}</span>
            <span>{match.nonStriker.runs}({match.nonStriker.balls})</span>
          </div>
        </div>

        {/* Bowler Section with WhatsApp */}
        <div onClick={() => selectPlayer('bowler')} style={{ marginTop: '15px', background: 'rgba(96, 165, 250, 0.1)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', color: '#60a5fa', cursor: 'pointer', alignItems: 'center' }}>
          <div>
            <div style={{fontSize:'12px', opacity:0.8}}>Current Bowler</div>
            <div style={{fontWeight:'bold'}}>⚪ {match.bowler.name}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontWeight:'bold'}}>{match.bowler.overs}.{match.bowler.balls}-{match.bowler.runs}R-{match.bowler.wkts}W</div>
            {match.bowler.phone && <a href={`https://wa.me/${match.bowler.phone}`} style={{fontSize:'10px', color:'#25D366', textDecoration:'none'}}>Chat WhatsApp</a>}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
        {[0, 1, 2, 3, 4, 6].map(r => (
          <button key={r} onClick={() => handleBall(r, 'run')} style={btnStyle}>{r}</button>
        ))}
        <button onClick={() => handleBall(0, 'wkt')} style={{ ...btnStyle, background: '#ef4444', color: 'white' }}>WKT</button>
        <button onClick={() => handleBall(0, 'wd')} style={{ ...btnStyle, background: '#eab308' }}>WD</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={setupFullMatch} style={utilBtn}>New Match Setup</button>
        <button onClick={() => updateDB({ ...match, score: 0, wickets: 0, balls: 0, overs: 0 })} style={{ ...utilBtn, background: '#475569' }}>Reset Score</button>
      </div>
    </div>
  );
}

const btnStyle: any = { padding: '20px 5px', fontSize: '22px', fontWeight: 'bold', border: 'none', borderRadius: '12px', background: 'white', color: '#1e293b', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };
const utilBtn: any = { flex: 1, padding: '15px', borderRadius: '10px', border: 'none', background: '#f5cd11', color: '#0f172a', fontWeight: 'bold', fontSize: '14px' };
