import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, push } from "firebase/database";

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
    teamAName: "Team A", teamBName: "Team B",
    umpire: "Umpire", striker: "Player 1", nonStriker: "Player 2", bowler: "Bowler 1",
    adminName: "Touqeer Iqbal", adminPic: "", whatsapp: "923015800630"
  });

  const [anim, setAnim] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) setMatch(snap.val());
    });
  }, []);

  const updateMatch = (data: any) => set(ref(db, 'liveMatch'), data);

  const setupTeams = () => {
    const tA = prompt("Team A Name:", match.teamAName) || match.teamAName;
    const tB = prompt("Team B Name:", match.teamBName) || match.teamBName;
    const emp = prompt("Empire Name:", match.umpire) || match.umpire;
    updateMatch({ ...match, teamAName: tA, teamBName: tB, umpire: emp });
  };

  const handleScore = (runs: number, type: string) => {
    let m = { ...match };
    if (type === 'run') {
      m.score += runs; m.balls += 1;
      if (runs === 1 || runs === 3) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      if (runs === 4) setAnim("🔥 FOUR!");
      if (runs === 6) setAnim("🚀 SIXER!");
    } else if (type === 'wkt') {
      m.wickets += 1; m.balls += 1; setAnim("☝️ OUT!");
      m.striker = prompt("Naya Batsman:") || m.striker;
    } else if (type === 'wd' || type === 'nb') {
      m.score += 1; setAnim(type === 'wd' ? "WIDE" : "NO BALL");
    }

    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
      m.bowler = prompt("Over End! Naye Bowler ka naam:") || m.bowler;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    updateMatch(m);
    setTimeout(() => setAnim(""), 2000);
  };

  const deleteMatch = () => {
    if (window.confirm("Kya aap waqai purana match delete kar ke naya shuru karna chahte hain?")) {
      remove(ref(db, 'liveMatch'));
      setMatch({ ...match, score: 0, wickets: 0, balls: 0, overs: 0 });
    }
  };

  const saveToHistory = () => {
    push(ref(db, 'history'), match);
    alert("Match record mein save ho gaya hai!");
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #f5cd11' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={match.adminPic || "https://via.placeholder.com/45"} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f5cd11' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{match.adminName}</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f5cd11' }}>ADHI KOT CRICKET PRO</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.whatsapp}`} target="_blank" style={{ background: '#25D366', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'white', textDecoration: 'none' }}>WhatsApp 💬</a>
      </div>

      {anim && <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '55px', fontWeight: '900', color: '#f5cd11', zIndex: 100 }}>{anim}</div>}

      <div style={{ padding: '15px' }}>
        {/* Scorecard */}
        <div style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', borderRadius: '15px', padding: '20px', border: '1px solid #475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#f5cd11', fontWeight: 'bold', marginBottom: '10px' }}>
            <span>{match.teamAName} vs {match.teamBName}</span>
            <span>Umpire: {match.umpire}</span>
          </div>
          <div style={{ fontSize: '50px', fontWeight: 'bold' }}>{match.score}/{match.wickets} <span style={{ fontSize: '18px', color: '#94a3b8' }}>({match.overs}.{match.balls})</span></div>
          
          <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🏏 <strong>{match.striker}*</strong></span>
              <span style={{ color: '#60a5fa' }}>⚪ {match.bowler}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>🏏 {match.nonStriker}</div>
          </div>
        </div>

        {/* Scoring Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleScore(r, 'run')} style={btnStyle}>{r}</button>)}
          <button onClick={() => handleScore(0, 'wkt')} style={{ ...btnStyle, background: '#ef4444' }}>WKT</button>
          <button onClick={() => handleScore(0, 'wd')} style={{ ...btnStyle, background: '#eab308' }}>WD</button>
          <button onClick={() => handleScore(0, 'nb')} style={{ ...btnStyle, background: '#eab308' }}>NB</button>
        </div>

        {/* Admin Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '25px' }}>
          <button onClick={setupTeams} style={utilBtn}>Teams Setup</button>
          <button onClick={saveToHistory} style={{ ...utilBtn, background: '#10b981' }}>Save Record</button>
          <button onClick={deleteMatch} style={{ ...utilBtn, background: '#475569' }}>Delete Match</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: any = { padding: '18px 5px', fontSize: '20px', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: 'white', color: '#1e293b' };
const utilBtn: any = { flex: '1 1 45%', padding: '10px', borderRadius: '8px', border: 'none', background: '#f5cd11', fontWeight: 'bold', color: '#0f172a' };
