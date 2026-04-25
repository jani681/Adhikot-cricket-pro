import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

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
    teamA: { name: "Team A", logo: "", players: [] },
    teamB: { name: "Team B", logo: "", players: [] },
    striker: "Batsman 1", nonStriker: "Batsman 2", bowler: "Bowler 1",
    umpire: "Umpire Name",
    adminName: "Touqeer Iqbal",
    adminPic: "",
    whatsapp: "923015800630"
  });

  const [anim, setAnim] = useState("");

  useEffect(() => {
    onValue(ref(db, 'match'), (snap) => snap.val() && setMatch(snap.val()));
  }, []);

  const updateDB = (data: any) => set(ref(db, 'match'), data);

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    if (type === 'run') {
      m.score += runs; m.balls += 1;
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      if (runs === 4) setAnim("🔥 FOUR!");
      if (runs === 6) setAnim("🚀 SIXER!");
    } else if (type === 'wkt') {
      m.wickets += 1; m.balls += 1; setAnim("☝️ OUT!");
      m.striker = prompt("Naya Batsman:") || "New Player";
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1;
    }

    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
      m.bowler = prompt("Agla Bowler:") || "New Bowler";
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    updateDB(m);
    setTimeout(() => setAnim(""), 2000);
  };

  const setupTeams = () => {
    let m = { ...match };
    m.teamA.name = prompt("Team A Name:") || m.teamA.name;
    m.teamB.name = prompt("Team B Name:") || m.teamB.name;
    m.umpire = prompt("Empire Name:") || m.umpire;
    updateDB(m);
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' }}>
      {/* Premium Header */}
      <div style={{ background: '#1e293b', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #f5cd11' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={match.adminPic || "https://via.placeholder.com/40"} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f5cd11' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{match.adminName}</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#f5cd11', letterSpacing: '1px' }}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.whatsapp}`} target="_blank" style={{ background: '#25D366', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>WhatsApp 💬</a>
      </div>

      {anim && <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px', fontWeight: '900', color: '#f5cd11', zIndex: 100, textShadow: '4px 4px #000' }}>{anim}</div>}

      <div style={{ padding: '15px' }}>
        {/* Scoreboard Card */}
        <div style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', borderRadius: '15px', padding: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', border: '1px solid #475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#f5cd11', fontWeight: 'bold' }}>
            <span>{match.teamA.name} vs {match.teamB.name}</span>
            <span>Umpire: {match.umpire}</span>
          </div>
          <div style={{ fontSize: '55px', fontWeight: 'bold' }}>{match.score}/{match.wickets} <span style={{ fontSize: '20px', color: '#94a3b8' }}>({match.overs}.{match.balls})</span></div>
          
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏏 <strong>{match.striker}*</strong></span>
              <span style={{ color: '#60a5fa' }}>⚪ {match.bowler}</span>
            </div>
            <div style={{ color: '#94a3b8', marginTop: '5px' }}>🏏 {match.nonStriker}</div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '25px' }}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={btnStyle}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wkt')} style={{ ...btnStyle, background: '#ef4444' }}>WKT</button>
          <button onClick={() => handleBall(0, 'wd')} style={{ ...btnStyle, background: '#eab308' }}>WD</button>
          <button onClick={() => handleBall(0, 'nb')} style={{ ...btnStyle, background: '#eab308' }}>NB</button>
        </div>

        {/* Settings Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
          <button onClick={setupTeams} style={utilBtn}>Teams Setup</button>
          <button onClick={() => updateDB({ ...match, score: 0, wickets: 0, balls: 0, overs: 0 })} style={{ ...utilBtn, background: '#475569' }}>Reset Match</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: any = { padding: '20px 5px', fontSize: '22px', fontWeight: 'bold', border: 'none', borderRadius: '12px', background: 'white', color: '#1e293b', cursor: 'pointer', boxShadow: '0 4px #cbd5e1' };
const utilBtn: any = { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#f5cd11', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' };
