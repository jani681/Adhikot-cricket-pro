import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function AdhiKotUltimateCricket() {
  const [match, setMatch] = useState<any>(null);
  const [view, setView] = useState("setup"); // setup, live, stats
  const [modal, setModal] = useState<any>(null); // For player selection
  const [anim, setAnim] = useState("");

  // Permanent Admin Data
  const adminInfo = {
    name: "Touqeer Iqbal",
    dp: "https://i.ibb.co/vzYyLz7/touqeer.jpg",
    whatsapp: "923015800630"
  };

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) {
        setMatch(snap.val());
        setView("live");
      }
    });
  }, []);

  const handleSetup = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    const teamA = {
      name: fd.get("tA") as string,
      players: (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }))
    };
    const teamB = {
      name: fd.get("tB") as string,
      players: (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }))
    };

    const newMatch = {
      teamA, teamB,
      umpire: fd.get("umpire"),
      toss: fd.get("toss"),
      target: 0,
      innings: 1,
      score: 0, wickets: 0, balls: 0, overs: 0,
      striker: { name: teamA.players[0].name, index: 0 },
      nonStriker: { name: teamA.players[1].name, index: 1 },
      bowler: { name: "Select Bowler", runs: 0, balls: 0, wkts: 0 },
      history: []
    };

    set(ref(db, 'liveMatch'), newMatch);
  };

  const updateBall = (runs: number, extra: string = "") => {
    let m = { ...match };
    if (extra === "W") {
      m.wickets += 1;
      m.balls += 1;
      setAnim("☝️ WICKET!");
      // Reset striker to be selected manually
      m.striker.name = "Select New Batsman";
    } else if (extra === "WD" || extra === "NB") {
      m.score += (1 + runs);
      setAnim(extra);
    } else {
      m.score += runs;
      m.balls += 1;
      if (runs === 4) setAnim("🏏 FOUR!");
      if (runs === 6) setAnim("🚀 SIX!");
      
      // Update individual batsman stats
      const pIndex = m.striker.index;
      const currentInnings = m.innings === 1 ? 'teamA' : 'teamB';
      m[currentInnings].players[pIndex].runs += runs;
      m[currentInnings].players[pIndex].balls += 1;

      if (runs % 2 !== 0) swapStriker(m);
    }

    if (m.balls === 6) {
      m.overs += 1;
      m.balls = 0;
      swapStriker(m);
      m.bowler.name = "Select Bowler"; // Force manual bowler selection every over
    }

    set(ref(db, 'liveMatch'), m);
    setTimeout(() => setAnim(""), 2000);
  };

  const swapStriker = (m: any) => {
    let temp = m.striker;
    m.striker = m.nonStriker;
    m.nonStriker = temp;
  };

  const selectPlayer = (role: string, player: any, index: number) => {
    let m = { ...match };
    if (role === 'striker') m.striker = { name: player.name, index };
    if (role === 'bowler') m.bowler = { ...m.bowler, name: player.name };
    set(ref(db, 'liveMatch'), m);
    setModal(null);
  };

  if (view === "setup") {
    return (
      <div style={container}>
        <div style={card}>
          <img src={adminInfo.dp} style={adminCircle} />
          <h2 style={{textAlign:'center'}}>{adminInfo.name} - Match Setup</h2>
          <form onSubmit={handleSetup} style={formStyle}>
            <input name="tA" placeholder="Team A Name" required style={input} />
            <textarea name="pA" placeholder="Team A Players (Ali, Ahmed, Khan...)" required style={input} />
            <input name="tB" placeholder="Team B Name" required style={input} />
            <textarea name="pB" placeholder="Team B Players (Abid, Jani, Rafi...)" required style={input} />
            <input name="umpire" placeholder="Umpire Name" style={input} />
            <input name="toss" placeholder="Who won the toss?" style={input} />
            <button type="submit" style={mainBtn}>START MATCH</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={liveContainer}>
      {/* Header */}
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={adminInfo.dp} style={miniDP} />
          <span style={headerText}>ADHI KOT CRICKET PRO</span>
        </div>
        <a href={`https://wa.me/${adminInfo.whatsapp}`} style={waBtn}>WhatsApp</a>
      </div>

      {/* Scoreboard */}
      <div style={scoreCard}>
        <div style={teamHeader}>{match.teamA.name} vs {match.teamB.name}</div>
        <div style={umpireLine}>Umpire: {match.umpire} | Toss: {match.toss}</div>
        
        <div style={mainScore}>{match.score}/{match.wickets} <span style={{fontSize:'24px'}}>({match.overs}.{match.balls})</span></div>

        <div style={statsSection}>
          <div style={playerLine} onClick={() => setModal('striker')}>
            🏏 {match.striker.name}* <span>{match.striker.index !== undefined ? `${match[match.innings === 1 ? 'teamA' : 'teamB'].players[match.striker.index].runs}(${match[match.innings === 1 ? 'teamA' : 'teamB'].players[match.striker.index].balls})` : "0(0)"}</span>
          </div>
          <div style={playerLine}>
            🏏 {match.nonStriker.name}
          </div>
          <div style={bowlerLine} onClick={() => setModal('bowler')}>
            🎾 Bowler: {match.bowler.name} <span>{match.bowler.wkts} Wkts</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={btnGrid}>
        {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => updateBall(r)} style={numBtn}>{r}</button>)}
        <button onClick={() => updateBall(0, "WD")} style={extraBtn}>WD</button>
        <button onClick={() => updateBall(0, "NB")} style={extraBtn}>NB</button>
        <button onClick={() => updateBall(0, "W")} style={wktBtn}>WICKET</button>
        <button onClick={() => { remove(ref(db, 'liveMatch')); setView("setup"); }} style={resetBtn}>Delete Match</button>
      </div>

      {/* Animations Overlay */}
      {anim && <div style={animOverlay}>{anim}</div>}

      {/* Player Selection Modal */}
      {modal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Select {modal}</h3>
            {match[match.innings === 1 ? 'teamA' : 'teamB'].players.map((p: any, i: number) => (
              <div key={i} onClick={() => selectPlayer(modal, p, i)} style={modalItem}>{p.name}</div>
            ))}
            <button onClick={() => setModal(null)} style={closeBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const container: any = { background: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' };
const card: any = { background: '#1e293b', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px' };
const adminCircle: any = { width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px', display: 'block', border: '3px solid #f5cd11' };
const formStyle: any = { display: 'flex', flexDirection: 'column', gap: '12px' };
const input: any = { padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' };
const mainBtn: any = { background: '#f5cd11', color: 'black', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };
const liveContainer: any = { background: '#0f172a', minHeight: '100vh', color: 'white' };
const header: any = { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderBottom: '2px solid #f5cd11' };
const miniDP: any = { width: '35px', height: '35px', borderRadius: '50%' };
const headerText: any = { fontWeight: 'bold', fontSize: '14px', color: '#f5cd11' };
const waBtn: any = { background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none' };
const scoreCard: any = { margin: '20px', padding: '20px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '25px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const teamHeader: any = { fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: '#94a3b8' };
const umpireLine: any = { fontSize: '11px', textAlign: 'center', color: '#64748b', margin: '5px 0' };
const mainScore: any = { fontSize: '60px', textAlign: 'center', margin: '15px 0', fontWeight: '900' };
const statsSection: any = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' };
const playerLine: any = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' };
const bowlerLine: any = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(245, 205, 17, 0.1)', borderRadius: '10px', color: '#f5cd11' };
const btnGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '20px' };
const numBtn: any = { padding: '20px', borderRadius: '12px', background: 'white', color: '#0f172a', fontWeight: 'bold', fontSize: '18px', border: 'none' };
const extraBtn: any = { background: '#f5cd11', color: 'black', borderRadius: '12px', border: 'none', fontWeight: 'bold' };
const wktBtn: any = { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold' };
const resetBtn: any = { gridColumn: 'span 4', background: '#334155', color: '#94a3b8', padding: '10px', border: 'none', borderRadius: '8px', marginTop: '10px' };
const animOverlay: any = { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '50px', fontWeight: '900', color: '#f5cd11', textShadow: '0 0 20px black', zIndex: 1000 };
const modalOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent: any = { background: '#1e293b', padding: '20px', borderRadius: '15px', width: '80%', maxHeight: '70%', overflowY: 'auto' };
const modalItem: any = { padding: '15px', borderBottom: '1px solid #334155', cursor: 'pointer' };
const closeBtn: any = { width: '100%', padding: '10px', marginTop: '10px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white' };
