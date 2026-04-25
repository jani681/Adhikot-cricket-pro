import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  storageBucket: "adhikot-cricket-pro.firebasestorage.app",
  messagingSenderId: "928473547152",
  appId: "1:928473547152:web:b3c13ee756cda6df7a7315",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [score, setScore] = useState(0);

  // Score ko real-time read karne ke liye
  useEffect(() => {
    const scoreRef = ref(db, 'liveScore');
    onValue(scoreRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setScore(data.score);
    });
  }, []);

  // Score update karne ka function
  const updateScore = (newScore: number) => {
    set(ref(db, 'liveScore'), { score: newScore });
  };

  return (
    <div style={{ backgroundColor: '#064e3b', minHeight: '100vh', color: 'white', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontStyle: 'italic', marginBottom: '5px' }}>Adhikot Cricket Pro</h1>
      <p style={{ fontSize: '14px', marginTop: '0', opacity: 0.8 }}>Admin Dashboard</p>

      <div style={{ backgroundColor: 'white', color: '#064e3b', padding: '40px', borderRadius: '25px', display: 'inline-block', marginTop: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', minWidth: '200px' }}>
        <h2 style={{ fontSize: '80px', margin: 0, fontWeight: 'bold' }}>{score}</h2>
        <p style={{ fontWeight: 'bold', letterSpacing: '2px', color: '#064e3b', margin: 0 }}>LIVE SCORE</p>
      </div>

      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxWidth: '350px', margin: '40px auto' }}>
        <button onClick={() => updateScore(score + 1)} style={{ padding: '20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>+1 Run</button>
        <button onClick={() => updateScore(score + 4)} style={{ padding: '20px', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>+4 Four</button>
        <button onClick={() => updateScore(score + 6)} style={{ padding: '20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>+6 Six</button>
        <button onClick={() => updateScore(0)} style={{ padding: '20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={{ marginTop: '50px', fontSize: '12px', opacity: 0.6 }}>
        <p>Connected to Firebase Realtime Database</p>
        <p>© 2026 Adhi Kot Sports</p>
      </div>
    </div>
  );
}
