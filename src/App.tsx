import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotCricketPro() {
  const [match, setMatch] = useState<any>(null);
  const [view, setView] = useState('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [anim, setAnim] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsub = onValue(matchRef, (snap) => {
      setMatch(snap.val());
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const trigger = (txt: string) => {
    setAnim(txt);
    setTimeout(() => setAnim(""), 2500);
  };

  const handleScore = (runs: number, type = "reg") => {
    if (!isAdmin || !match) return;
    let m = { ...match };
    
    // Safety check for numbers
    m.score = (m.score || 0);
    m.wkts = (m.wkts || 0);
    m.ovs = (m.ovs || 0);
    m.balls = (m.balls || 0);

    if (type === "W") {
      m.wkts += 1; m.balls += 1; trigger("OUT! ☝️");
    } else if (type === "WD" || type === "NB") {
      m.score += (runs + 1); trigger(type === "WD" ? "WIDE" : "NO BALL");
    } else {
      m.score += runs; m.balls += 1;
      if (runs === 4) trigger("FOUR! 🏏");
      if (runs === 6) trigger("SIX! 🚀");
    }

    if (m.balls >= 6) { m.ovs += 1; m.balls = 0; }
    set(ref(db, 'liveMatch'), m);
  };

  if (loading) return <div style={{background:'#020617', color:'#facc15', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Connecting to Database...</div>;

  return (
    <div style={{background: '#020617', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif'}}>
      {/* Header */}
      <div style={{padding: '15px', background: '#0f172a', borderBottom: '2px solid #facc15', display: 'flex', justifyContent: 'space-between'}}>
        <b>Touqeer Iqbal | Adhikot Pro</b>
        <button onClick={() => {
            const p = prompt("Enter Admin PIN:");
            if(p === "6545") setIsAdmin(true);
        }} style={{background: isAdmin ? '#22c55e' : '#334155', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 10px'}}>
            {isAdmin ? "Admin: ON" : "Admin: OFF"}
        </button>
      </div>

      {anim && <div style={{position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', background: '#facc15', color: '#000', padding: '30px 50px', borderRadius: '100px', fontSize: '40px', fontWeight: 'bold', zIndex: 1000}}>{anim}</div>}

      {!match ? (
        <div style={{textAlign: 'center', marginTop: '100px'}}>
          <p>No Live Match Found.</p>
          {isAdmin && <button onClick={() => set(ref(db, 'liveMatch'), { league: "Adhi Kot Premium", score: 0, wkts: 0, ovs: 0, balls: 0, umpire: "Touqeer", team1: {name: "Team A"}, team2: {name: "Team B" }})} style={{padding: '10px 20px', background: '#facc15', border: 'none', borderRadius: '8px'}}>Start Demo Match</button>}
        </div>
      ) : (
        <div style={{padding: '20px'}}>
          <div style={{background: 'linear-gradient(to bottom, #1e293b, #020617)', padding: '30px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155'}}>
            <h1 style={{fontSize: '60px', color: '#facc15', margin: '0'}}>{match?.score || 0}/{match?.wkts || 0}</h1>
            <h2 style={{margin: '5px 0'}}>({match?.ovs || 0}.{match?.balls || 0})</h2>
            <p>Empire: {match?.umpire || "N/A"}</p>
          </div>

          {isAdmin && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '30px'}}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleScore(n)} style={{padding: '20px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', border: 'none'}}>{n}</button>)}
              <button onClick={() => handleScore(0, "WD")} style={{padding: '20px', background: '#facc15', borderRadius: '10px', border: 'none'}}>WD</button>
              <button onClick={() => handleScore(0, "NB")} style={{padding: '20px', background: '#facc15', borderRadius: '10px', border: 'none'}}>NB</button>
              <button onClick={() => handleScore(0, "W")} style={{padding: '20px', background: '#ef4444', color: '#fff', borderRadius: '10px', border: 'none'}}>WKT</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
