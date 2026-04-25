import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  storageBucket: "adhikot-cricket-pro.firebasestorage.app",
  messagingSenderId: "928473547152",
  appId: "1:928473547152:web:b3c13ee756cda6df7a7315",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [match, setMatch] = useState({
    score: 0, wickets: 0, balls: 0, overs: 0,
    teamA: "Adhikot Lions", teamB: "Khushab Tigers",
    striker: "Player 1", nonStriker: "Player 2", bowler: "Bowler 1",
    adminName: "Touqeer Iqbal",
    adminPic: "https://via.placeholder.com/50" // Aap apni WhatsApp pic link yahan dalen gy
  });

  const [anim, setAnim] = useState("");

  useEffect(() => {
    onValue(ref(db, 'match'), (snap) => snap.val() && setMatch(snap.val()));
  }, []);

  const updateMatch = (data: any) => set(ref(db, 'match'), data);

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    if (type === 'run') {
      m.score += runs;
      m.balls += 1;
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      if (runs === 4) setAnim("🔥 FOUR!");
      if (runs === 6) setAnim("🚀 SIXER!");
    } else if (type === 'wkt') {
      m.wickets += 1; m.balls += 1; setAnim("☝️ OUT!");
      m.striker = prompt("Naya Batsman likhen:") || "New Player";
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1; setAnim(type === 'wd' ? "WIDE" : "NO BALL");
    }

    if (m.balls >= 6) { 
      m.overs += 1; m.balls = 0; 
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; // Over end strike change
    }
    updateMatch(m);
    setTimeout(() => setAnim(""), 2000);
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Top Bar - Cricbuzz style */}
      <div style={{ background: '#1a1d23', color: '#f5cd11', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Adhikot Cricket Pro</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'white' }}>{match.adminName}</span>
          <img src={match.adminPic} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="admin" />
        </div>
      </div>

      {/* Animation Text */}
      {anim && <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: 'bold', color: '#1a1d23', zIndex: 10, textShadow: '2px 2px #f5cd11' }}>{anim}</div>}

      <div style={{ padding: '10px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>{match.teamA} vs {match.teamB}</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{match.score}/{match.wickets} <span style={{ fontSize: '16px', color: '#888' }}>({match.overs}.{match.balls})</span></div>
          
          <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '14px' }}>
            <div>🏏 <strong>{match.striker}*</strong></div>
            <div style={{ color: '#666' }}>🏏 {match.nonStriker}</div>
            <div style={{ marginTop: '5px', textAlign: 'right' }}>🎾 {match.bowler}</div>
          </div>
        </div>

        {/* Scoring Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '15px' }}>
          {[0, 1, 2, 3, 4, 6].map(r => (
            <button key={r} onClick={() => handleBall(r, 'run')} style={btnStyle}>{r}</button>
          ))}
          <button onClick={() => handleBall(0, 'wkt')} style={{ ...btnStyle, background: '#e53935', color: 'white' }}>WKT</button>
          <button onClick={() => handleBall(0, 'wd')} style={{ ...btnStyle, background: '#ffb300' }}>WD</button>
          <button onClick={() => handleBall(0, 'nb')} style={{ ...btnStyle, background: '#ffb300' }}>NB</button>
        </div>

        {/* Match Controls */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={() => {
            const b = prompt("Bowler ka naam:");
            if(b) updateMatch({...match, bowler: b});
          }} style={ctrlBtn}>Change Bowler</button>
          <button onClick={() => updateMatch({...match, score:0, wickets:0, balls:0, overs:0})} style={{ ...ctrlBtn, background: '#555', color: 'white' }}>Reset Match</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = { padding: '15px 5px', fontSize: '18px', fontWeight: 'bold', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer' };
const ctrlBtn = { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#ddd', fontWeight: 'bold' };
