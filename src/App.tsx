import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// Firebase Config (Aap ki pehle wali settings)
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
  const [matchData, setMatchData] = useState({
    runs: 0,
    wickets: 0,
    balls: 0,
    overs: 0,
    striker: "Batsman 1",
    nonStriker: "Batsman 2",
    bowler: "Bowler Name",
    teamA: "Team A",
    teamB: "Team B",
    target: 0
  });

  const [animation, setAnimation] = useState("");

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMatchData(data);
    });
  }, []);

  const triggerAnimation = (text: string) => {
    setAnimation(text);
    setTimeout(() => setAnimation(""), 3000);
  };

  const handleScore = (value: number, type: string) => {
    let newRuns = matchData.runs;
    let newWickets = matchData.wickets;
    let newBalls = matchData.balls;
    let newOvers = matchData.overs;

    if (type === 'run') {
      newRuns += value;
      newBalls += 1;
      if (value === 4) triggerAnimation("🔥 FOUR!");
      if (value === 6) triggerAnimation("🚀 SIXER!");
    } else if (type === 'wicket') {
      newWickets += 1;
      newBalls += 1;
      triggerAnimation("☝️ OUT!");
    } else if (type === 'wide' || type === 'noball') {
      newRuns += 1; // Extra run
    }

    if (newBalls >= 6) {
      newOvers += 1;
      newBalls = 0;
    }

    const updatedData = { ...matchData, runs: newRuns, wickets: newWickets, balls: newBalls, overs: newOvers };
    set(ref(db, 'liveMatch'), updatedData);
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Header - Cricbuzz Style */}
      <div style={{ backgroundColor: '#222529', color: '#f5cd11', padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '20px' }}>
        Adhikot Cricket Pro
      </div>

      {/* Animation Overlay */}
      {animation && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.9)', color: 'white', padding: '50px', borderRadius: '20px', fontSize: '50px', zIndex: 100, border: '5px solid #f5cd11' }}>
          {animation}
        </div>
      )}

      {/* Score Card */}
      <div style={{ margin: '15px', backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{matchData.teamA} vs {matchData.teamB}</span>
          <span style={{ color: 'red', fontSize: '12px' }}>● LIVE</span>
        </div>
        
        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'baseline' }}>
          <h1 style={{ fontSize: '45px', margin: 0 }}>{matchData.runs}/{matchData.wickets}</h1>
          <span style={{ marginLeft: '10px', color: '#666' }}>({matchData.overs}.{matchData.balls} Overs)</span>
        </div>
      </div>

      {/* Batsman & Bowler Info */}
      <div style={{ margin: '15px', backgroundColor: '#e7e9eb', padding: '15px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <div style={{ fontWeight: 'bold' }}>🏏 {matchData.striker}*</div>
          <div>{matchData.bowler} 🎾</div>
        </div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>🏏 {matchData.nonStriker}</div>
      </div>

      {/* Scorer Buttons - Proper Grid */}
      <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[0, 1, 2, 3, 4, 6].map(num => (
          <button onClick={() => handleScore(num, 'run')} style={btnStyle}>{num}</button>
        ))}
        <button onClick={() => handleScore(0, 'wicket')} style={{ ...btnStyle, backgroundColor: '#d32f2f', color: 'white' }}>WKT</button>
        <button onClick={() => handleScore(0, 'wide')} style={{ ...btnStyle, backgroundColor: '#f5cd11' }}>WD</button>
        <button onClick={() => handleScore(0, 'noball')} style={{ ...btnStyle, backgroundColor: '#f5cd11' }}>NB</button>
      </div>

      {/* Admin Panel Link Placeholder */}
      <div style={{ textAlign: 'center', marginTop: '20px', padding: '10px', color: '#666', fontSize: '12px' }}>
        Admin: Touqeer Iqbal | WhatsApp Integrated
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '20px 10px',
  fontSize: '18px',
  fontWeight: 'bold',
  borderRadius: '8px',
  border: '1px solid #ccc',
  backgroundColor: 'white',
  cursor: 'pointer'
};
