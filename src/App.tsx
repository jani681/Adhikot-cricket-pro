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
    striker: "Batsman 1", nonStriker: "Batsman 2", bowler: "Bowler 1",
    adminName: "Touqeer Iqbal", 
    adminPic: "", 
    whatsapp: "923015800630" // Aap ka number add ho gaya hai
  });

  const [anim, setAnim] = useState("");

  useEffect(() => {
    onValue(ref(db, 'match'), (snap) => {
      if (snap.val()) setMatch(snap.val());
    });
  }, []);

  const updateDB = (newData: any) => set(ref(db, 'match'), newData);

  const handlePicUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      updateDB({ ...match, adminPic: reader.result });
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleBall = (runs: number, type: string) => {
    let m = { ...match };
    if (type === 'run') {
      m.score += runs; m.balls += 1;
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
      const nextBowler = prompt("Over khatam! Aglay Bowler ka naam:");
      m.bowler = nextBowler || "New Bowler";
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    updateDB(m);
    setTimeout(() => setAnim(""), 2500);
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header with Touqeer Bhai's Profile */}
      <div style={{ background: '#1a1d23', color: '#f5cd11', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <input type="file" onChange={handlePicUpload} style={{ display: 'none' }} />
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#333', overflow: 'hidden', border: '2px solid #f5cd11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {match.adminPic ? <img src={match.adminPic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '8px', color: 'white' }}>PIC</span>}
            </div>
          </label>
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{match.adminName}</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>Admin Dashboard</div>
          </div>
        </div>
        <a href={`https://wa.me/${match.whatsapp}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
          WhatsApp 💬
        </a>
      </div>

      {anim && <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '50px', fontWeight: 'bold', color: '#1a1d23', zIndex: 100, textShadow: '2px 2px #f5cd11', textAlign: 'center', width: '100%' }}>{anim}</div>}

      <div style={{ padding: '15px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '45px', fontWeight: 'bold', color: '#222' }}>{match.score}/{match.wickets} <span style={{ fontSize: '20px', color: '#666', fontWeight: 'normal' }}>({match.overs}.{match.balls})</span></div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>🏏 <strong>{match.striker}*</strong></span>
              <span style={{ color: '#007bff', fontWeight: 'bold' }}>🎾 {match.bowler}</span>
            </div>
            <div style={{ color: '#666' }}>🏏 {match.nonStriker}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
          {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => handleBall(r, 'run')} style={btnStyle}>{r}</button>)}
          <button onClick={() => handleBall(0, 'wkt')} style={{ ...btnStyle, background: '#d32f2f', color: 'white' }}>WKT</button>
          <button onClick={() => handleBall(0, 'wd')} style={{ ...btnStyle, background: '#ffb300' }}>WD</button>
          <button onClick={() => handleBall(0, 'nb')} style={{ ...btnStyle, background: '#ffb300' }}>NB</button>
        </div>

        <button onClick={() => { if(window.confirm("Match Reset Karen?")) updateDB({ ...match, score: 0, wickets: 0, balls: 0, overs: 0 })}} style={{ width: '100%', marginTop: '30px', padding: '12px', borderRadius: '8px', border: 'none', background: '#444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Reset Match</button>
      </div>
    </div>
  );
}

const btnStyle = { padding: '22px 5px', fontSize: '20px', fontWeight: 'bold', border: 'none', borderRadius: '10px', background: 'white', boxShadow: '0 3px 6px rgba(0,0,0,0.1)', cursor: 'pointer' };
