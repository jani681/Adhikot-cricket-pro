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

  const selectPlayerManually = (role: 'striker' | 'nonStriker' | 'bowler') => {
    const isBowler = role === 'bowler';
    const players = isBowler 
      ? (match.battingTeam === 'A' ? match.teamBPlayers : match.teamAPlayers)
      : (match.battingTeam === 'A' ? match.teamAPlayers : match.teamBPlayers);

    const available = isBowler ? players : players.filter(p => p.status === "Yet to Bat");
    
    if (available.length === 0) return alert("Koi player dastiyab nahi!");

    const list = available.map((p, i) => `${i + 1}: ${p.name} (${p.status})`).join('\n');
    const idx = prompt(`Select ${role.toUpperCase()}:\n${list}`);
    
    if (idx && available[parseInt(idx) - 1]) {
      const p = available[parseInt(idx) - 1];
      let m = { ...match };
      
      if (!isBowler) {
        // Update status in the main team list
        const teamKey = m.battingTeam === 'A' ? 'teamAPlayers' : 'teamBPlayers';
        m[teamKey] = m[teamKey].map((pl: any) => pl.name === p.name ? { ...pl, status: "Batting" } : pl);
        m[role] = { name: p.name, runs: 0, balls: 0, phone: p.phone };
      } else {
        m.bowler = { name: p.name, overs: 0, balls: 0, runs: 0, wkts: 0, phone: p.phone };
      }
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
      if (runs === 4) triggerAnim("🔥 FOUR!");
      if (runs === 6) triggerAnim("🚀 SIXER!");
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wkt') {
      triggerAnim("☝️ OUT!");
      m.wickets += 1; m.balls += 1; m.bowler.wkts += 1;
      
      const teamKey = m.battingTeam === 'A' ? 'teamAPlayers' : 'teamBPlayers';
      m[teamKey] = m[teamKey].map((p: any) => p.name === m.striker.name ? { ...p, status: "Out", runs: m.striker.runs, balls: m.striker.balls } : p);

      if (m.wickets >= m[teamKey].length - 1) {
        if (m.innings === 1) {
          alert("Innings Over!");
          m.target = m.score + 1; m.innings = 2; m.score = 0; m.wickets = 0; m.balls = 0; m.overs = 0;
          m.battingTeam = m.battingTeam === 'A' ? 'B' : 'A';
          m.striker = { name: "Select Striker", runs: 0, balls: 0 };
          m.nonStriker = { name: "Select Non-Striker", runs: 0, balls: 0 };
          m.bowler = { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0 };
        } else {
          alert("Match Finished!");
        }
      } else {
        m.striker = { name: "Select Striker", runs: 0, balls: 0 };
        updateDB(m);
        return selectPlayerManually('striker');
      }
    }

    if (m.balls === 6) {
      m.overs += 1; m.balls = 0; m.bowler.overs += 1; m.bowler.balls = 0;
      updateDB(m);
      triggerAnim("OVER END");
      return selectPlayerManually('bowler');
    }
    updateDB(m);
  };

  const setupMatch = () => {
    const tA = prompt("Team A Name:") || "Team A";
    const pA = prompt("Team A Players (Ali:923..., Khan:923...):") || "";
    const tB = prompt("Team B Name:") || "Team B";
    const pB = prompt("Team B Players (Umar:923..., Jani:923...):") || "";

    const parse = (s: string) => s.split(',').map(x => ({ 
      name: x.split(':')[0].trim(), 
      phone: x.split(':')[1]?.trim() || "", 
      status: "Yet to Bat", runs: 0, balls: 0 
    }));

    updateDB({
      ...match, teamA: tA, teamB: tB, teamAPlayers: parse(pA), teamBPlayers: parse(pB),
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1, target: 0,
      striker: { name: "Select Striker", runs: 0, balls: 0 },
      nonStriker: { name: "Select Non-Striker", runs: 0, balls: 0 },
      bowler: { name: "Select Bowler", overs: 0, balls: 0, runs: 0, wkts: 0 }
    });
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      {anim && <div style={animOverlay}>{anim}</div>}
      
      {/* Fixed Admin Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="https://i.ibb.co/vzYyLz7/touqeer.jpg" style={dpStyle} alt="Admin" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{match.adminName}</div>
            <div style={{ fontWeight: 'bold', color: '#f5cd11' }}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.adminWA}`} style={waBtn}>WhatsApp</a>
      </div>

      <div style={{ padding: '15px' }}>
        <div style={scoreCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={() => setModal({ show: true, team: 'A' })} style={teamBtn}>{match.teamA}</button>
            <button onClick={() => setModal({ show: true, team: 'B' })} style={teamBtn}>{match.teamB}</button>
          </div>
          
          <h1 style={{ fontSize: '55px', textAlign: 'center', margin: '5px 0' }}>
            {match.score}/{match.wickets}
            <span style={{ fontSize: '18px', color: '#94a3b8', marginLeft: '10px' }}>({match.overs}.{match.balls})</span>
          </h1>

          {match.target > 0 && (
            <div style={targetBar}>Target: {match.target} | Need {match.target - match.score} runs</div>
          )}

          <div style={{ borderTop: '1px solid #334155', paddingTop: '10px' }}>
            <div onClick={() => selectPlayerManually('striker')} style={playerRow}>
              <span>🏏 {match.striker.name}*</span>
              <span>{match.striker.runs}({match.striker.balls})</span>
            </div>
            <div onClick={() => selectPlayerManually('nonStriker')} style={{ ...playerRow, color: '#94a3b8' }}>
              <span>🏏 {match.nonStriker.name}</span>
              <span>{match.nonStriker.runs}({match.nonStriker.balls})</span>
            </div>
          </div>

          <div onClick={() => selectPlayerManually('bowler')} style={bowlerBox}>
            <span>⚪ {match.bowler.name}</span>
            <span>{match.bowler.overs}.{match.bowler.balls}-{match.bowler.runs}R-{match.bowler.wkts}W</span>
          </div>
        </div>

        <div style={controlsGrid}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={actionBtn}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wkt')} style={{ ...actionBtn, background: '#ef4444', color: 'white' }}>WKT</button>
          <button onClick={() => handleBall(0, 'wd')} style={{ ...actionBtn, background: '#eab308' }}>WD</button>
        </div>

        <button onClick={setupMatch} style={fullWidthBtn}>New Match Setup</button>
      </div>

      {/* Professional List Modal */}
      {modal.show && (
        <div style={modalBg}>
          <div style={modalContent}>
            <h3 style={{ color: '#f5cd11' }}>{modal.team === 'A' ? match.teamA : match.teamB} Squad</h3>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {(modal.team === 'A' ? match.teamAPlayers : match.teamBPlayers).map((p: any, i: number) => (
                <div key={i} style={playerListItem}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <small style={{ color: p.status === 'Out' ? '#ef4444' : p.status === 'Batting' ? '#22c55e' : '#94a3b8' }}>
                      {p.status} {p.status === 'Out' ? `(${p.runs}/${p.balls})` : ''}
                    </small>
                  </div>
                  <a href={`https://wa.me/${p.phone}`} style={{ textDecoration: 'none' }}>💬</a>
                </div>
              ))}
            </div>
            <button onClick={() => setModal({ ...modal, show: false })} style={closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimalist Styles
const headerStyle: any = { background: '#1e293b', padding: '15px', borderBottom: '2px solid #f5cd11', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 };
const dpStyle: any = { width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #f5cd11' };
const waBtn: any = { background: '#25D366', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', textDecoration: 'none' };
const scoreCard: any = { background: '#1e293b', padding: '20px', borderRadius: '25px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const teamBtn: any = { background: '#334155', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '12px' };
const playerRow: any = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer' };
const bowlerBox: any = { marginTop: '15px', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', color: '#60a5fa', cursor: 'pointer' };
const controlsGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' };
const actionBtn: any = { padding: '20px', fontSize: '22px', fontWeight: 'bold', border: 'none', borderRadius: '15px', background: 'white', color: '#1e293b' };
const fullWidthBtn: any = { width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', border: 'none', background: '#f5cd11', fontWeight: 'bold' };
const modalBg: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 };
const modalContent: any = { background: '#1e293b', width: '85%', padding: '25px', borderRadius: '25px', border: '1px solid #444' };
const playerListItem: any = { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #334155', alignItems: 'center' };
const closeBtn: any = { width: '100%', marginTop: '20px', padding: '12px', background: '#f5cd11', border: 'none', borderRadius: '15px', fontWeight: 'bold' };
const targetBar: any = { textAlign: 'center', background: 'rgba(245,205,17,0.1)', color: '#f5cd11', padding: '8px', borderRadius: '10px', margin: '10px 0', fontWeight: 'bold' };
const animOverlay: any = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: '900', color: '#f5cd11', zIndex: 500, textShadow: '0 0 20px black' };
