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
  const [score, setScore] = useState(0);

  useEffect(() => {
    const scoreRef = ref(db, 'liveScore');
    onValue(scoreRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setScore(data.score);
    });
  }, []);

  const updateScore = (newScore: number) => {
    set(ref(db, 'liveScore'), { score: newScore });
  };

  return (
    <div style={{ backgroundColor: '#064e3b', minHeight: '100vh', color: 'white', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontStyle: 'italic' }}>Adhikot Cricket Pro</h1>
      <p style={{ fontSize: '14px' }}>Admin: Touqeer Iqbal Baghoor</p>

      <div style={{ backgroundColor: 'white', color: '#064e3b', padding: '40px', borderRadius: '20px', display: 'inline-block', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontSize: '70px', margin: 0 }}>{score}</h2>
        <p style={{ fontWeight: 'bold', letterSpacing: '1px' }}>LIVE SCORE</p>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxWidth: '350px', margin: '30px auto' }}>
        <button onClick={() => updateScore(score + 1)} style={{ padding: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>+1 Run</button>
        <button onClick={() => updateScore(score + 4)} style={{ padding: '15px', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>+4 Four</button>
        <button onClick={() => updateScore(score + 6)} style={{ padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>+6 Six</button>
        <button onClick={() => updateScore(0)} style={{ padding: '15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Reset</button>
      </div>
    </div>
  );
}
