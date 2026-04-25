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
    teamA: "Team A", teamB: "Team B", umpire: "Umpire",
    striker: "Batsman 1", nonStriker: "Batsman 2", bowler: "Bowler 1",
    adminPic: "", whatsapp: "923015800630"
  });

  const [anim, setAnim] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) setMatch(snap.val());
    });
  }, []);

  const updateDB = (data: any) => set(ref(db, 'liveMatch'), data);

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    
    if (type === 'run') {
      m.score += runs;
      m.balls += 1;
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    } else if (type === 'wkt') {
      m.wickets += 1;
      m.balls += 1;
      m.striker = prompt("Naya Batsman likhen:") || "New Batsman";
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1; // Extra run, ball count nahi hogi
    }

    // Bug Fix: Sirf 6 balls mukammal hone par bowler change ho
    if (m.balls === 6) {
      m.overs += 1;
      m.balls = 0;
      const nextB = prompt("Over End! Aglay Bowler ka naam:");
      if (nextB) m.bowler = nextB;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; // Strike change on over end
    }

    updateDB(m);
  };

  const setupTeams = () => {
    const tA = prompt("Team A Name:", match.teamA) || match.teamA;
    const tB = prompt("Team B Name:", match.teamB) || match.teamB;
    const emp = prompt("Umpire Name:", match.umpire) || match.umpire;
    updateDB({ ...match, teamA: tA, teamB: tB, umpire: emp });
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Stylish Header */}
      <div style={{ background: '#1e293b', padding: '15px', borderBottom: '3px solid #f5cd11', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#444', border: '2px solid #f5cd11', overflow: 'hidden' }}>
             {match.adminPic && <img src={match.adminPic} style={{width:'100%'}} />}
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Touqeer Iqbal</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f5cd11' }}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.whatsapp}`} target="_blank" style={{ background: '#25D366', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', textDecoration: 'none' }}>WhatsApp 💬</a>
      </div>

      <div style={{ padding: '15px' }}>
        {/* Scorecard fix - Showing Team Names */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '15px', padding: '20px', border: '1px solid #475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f5cd11', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
            <span>{match.teamA} vs {match.teamB}</span>
            <span>Umpire: {match.umpire}</span>
          </div>
          <div style={{ fontSize: '50px', fontWeight: 'bold' }}>{match.score}/{match.wickets} <span style={{ fontSize: '20px', color: '#94a3b8' }}>({match.overs}.{match.balls})</span></div>
          
          <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🏏 {match.striker}*</span>
              <span style={{ color: '#60a5fa' }}>⚪ {match.bowler}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>🏏 {match.nonStriker}</div>
          </div>
        </div>

        {/* Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={btnStyle}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wkt')} style={{ ...btnStyle, background: '#ef4444', color: 'white' }}>WKT</button>
          <button onClick={() => handleBall(0, 'wd')} style={{ ...btnStyle, background: '#eab308' }}>WD</button>
          <button onClick={() => handleBall(0, 'nb')} style={{ ...btnStyle, background: '#eab308' }}>NB</button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button onClick={setupTeams} style={utilBtn}>Teams Setup</button>
          <button onClick={() => updateDB({ ...match, score: 0, wickets: 0, balls: 0, overs: 0 })} style={{ ...utilBtn, background: '#475569' }}>Reset</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: any = { padding: '18px 5px', fontSize: '20px', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: 'white', color: '#1e293b' };
const utilBtn: any = { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#f5cd11', color: '#0f172a', fontWeight: 'bold' };
