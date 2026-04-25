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

// FIXED ADMIN DATA
const ADMIN = {
  name: "Touqeer Iqbal",
  dp: "https://i.ibb.co/vzYyLz7/touqeer.jpg", // Make sure this link is correct
  wa: "923015800630"
};

export default function AdhiKotCricketFinal() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<{type: string, team: string} | null>(null);
  const [isSetup, setIsSetup] = useState(true);

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => {
      if (snap.val()) {
        setMatch(snap.val());
        setIsSetup(false);
      }
    });
  }, []);

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tA = fd.get("tA") as string;
    const tB = fd.get("tB") as string;
    
    const playersA = (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const playersB = (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    const init = {
      teamA: { name: tA, players: playersA },
      teamB: { name: tB, players: playersB },
      score: 0, wickets: 0, balls: 0, overs: 0,
      innings: 1,
      striker: { name: "Select Striker", idx: -1 },
      nonStriker: { name: "Select Non-Striker", idx: -1 },
      bowler: { name: "Select Bowler", wkts: 0 },
      target: null
    };
    set(ref(db, 'liveMatch'), init);
  };

  const updateScore = (runs: number, extra: string = "") => {
    if (!match || match.wickets >= 10) return alert("Innings Over!");
    if (match.striker.idx === -1 || match.nonStriker.idx === -1) return alert("Pehlay dono Batsmen select karein!");

    let m = { ...match };
    const batTeam = m.innings === 1 ? 'teamA' : 'teamB';

    if (extra === "W") {
      m.wickets += 1;
      m.balls += 1;
      m[batTeam].players[m.striker.idx].balls += 1;
      m.striker = { name: "Select New Batsman", idx: -1 };
    } else if (extra === "WD" || extra === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs;
      m.balls += 1;
      m[batTeam].players[m.striker.idx].runs += runs;
      m[batTeam].players[m.striker.idx].balls += 1;
      if (runs % 2 !== 0) swap(m);
    }

    if (m.balls === 6) { m.overs += 1; m.balls = 0; swap(m); m.bowler.name = "Select Bowler"; }
    set(ref(db, 'liveMatch'), m);
  };

  const swap = (m: any) => {
    let t = m.striker;
    m.striker = m.nonStriker;
    m.nonStriker = t;
  };

  const setPlayer = (p: any, i: number) => {
    let m = { ...match };
    if (modal?.type === 'striker') m.striker = { name: p.name, idx: i };
    if (modal?.type === 'nonStriker') m.nonStriker = { name: p.name, idx: i };
    if (modal?.type === 'bowler') m.bowler.name = p.name;
    set(ref(db, 'liveMatch'), m);
    setModal(null);
  };

  if (isSetup) {
    return (
      <div style={setupCont}>
        <div style={setupCard}>
          <img src={ADMIN.dp} style={setupDP} />
          <h2 style={{textAlign:'center', color:'#f5cd11'}}>{ADMIN.name} Setup</h2>
          <form onSubmit={startMatch} style={form}>
            <input name="tA" placeholder="Team A (Batting First)" required style={input} />
            <textarea name="pA" placeholder="Team A Players (Comma separated)" required style={area} />
            <input name="tB" placeholder="Team B (Bowling First)" required style={input} />
            <textarea name="pB" placeholder="Team B Players (Comma separated)" required style={area} />
            <button type="submit" style={goBtn}>START PRO MATCH</button>
          </form>
        </div>
      </div>
    );
  }

  const batTeamKey = match.innings === 1 ? 'teamA' : 'teamB';
  const bowlTeamKey = match.innings === 1 ? 'teamB' : 'teamA';

  return (
    <div style={appWrap}>
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={ADMIN.dp} style={miniDP} />
          <span style={headText}>{ADMIN.name} PRO</span>
        </div>
        <a href={`https://wa.me/${ADMIN.wa}`} style={waBtn}>WhatsApp</a>
      </div>

      <div style={scoreZone}>
        <div style={vsLine}>
          <span onClick={() => setModal({type:'striker', team:batTeamKey})}>{match.teamA.name}</span>
          <span style={{color:'#f5cd11'}}>VS</span>
          <span onClick={() => setModal({type:'bowler', team:bowlTeamKey})}>{match.teamB.name}</span>
        </div>

        <div style={bigNum}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>

        <div style={battingBox}>
          <div style={playerRow} onClick={() => setModal({type:'striker', team:batTeamKey})}>
            🏏 {match.striker.name}* <span>{match.striker.idx !== -1 ? `${match[batTeamKey].players[match.striker.idx].runs}(${match[batTeamKey].players[match.striker.idx].balls})` : ""}</span>
          </div>
          <div style={playerRow} onClick={() => setModal({type:'nonStriker', team:batTeamKey})}>
            🏏 {match.nonStriker.name} 
            <span>{match.nonStriker.idx !== -1 ? `${match[batTeamKey].players[match.nonStriker.idx].runs}(${match[batTeamKey].players[match.nonStriker.idx].balls})` : ""}</span>
          </div>
          <div style={bowlRow} onClick={() => setModal({type:'bowler', team:bowlTeamKey})}>
            🎾 {match.bowler.name}
          </div>
        </div>
      </div>

      <div style={btnGrid}>
        {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => updateScore(n)} style={numBtn}>{n}</button>)}
        <button onClick={() => updateScore(0, "WD")} style={exBtn}>WD</button>
        <button onClick={() => updateScore(0, "NB")} style={exBtn}>NB</button>
        <button onClick={() => updateScore(0, "W")} style={wktBtn}>WICKET</button>
        <button onClick={() => {if(confirm("New Match?")) set(ref(db, 'liveMatch'), null); setIsSetup(true);}} style={reset}>Reset</button>
      </div>

      {modal && (
        <div style={modalBg}>
          <div style={modalContent}>
            <h3>Select Player ({modal.team === 'teamA' ? match.teamA.name : match.teamB.name})</h3>
            {match[modal.team].players.map((p: any, i: number) => (
              <div key={i} onClick={() => setPlayer(p, i)} style={playerItem}>{p.name}</div>
            ))}
            <button onClick={() => setModal(null)} style={closeBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const setupCont: any = { background: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '20px' };
const setupCard: any = { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '450px' };
const setupDP: any = { width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 15px', display: 'block', border: '3px solid #f5cd11' };
const form: any = { display: 'flex', flexDirection: 'column', gap: '15px' };
const input: any = { padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' };
const area: any = { padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', minHeight: '80px' };
const goBtn: any = { background: '#f5cd11', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' };
const appWrap: any = { background: '#0f172a', minHeight: '100vh', color: 'white' };
const header: any = { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#1e293b', borderBottom: '2px solid #f5cd11' };
const miniDP: any = { width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #f5cd11' };
const headText: any = { fontWeight: 'bold', fontSize: '14px', color: '#f5cd11' };
const waBtn: any = { background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px' };
const scoreZone: any = { margin: '20px', padding: '20px', background: 'linear-gradient(to bottom, #1e293b, #0f172a)', borderRadius: '25px', border: '1px solid #334155' };
const vsLine: any = { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#94a3b8' };
const bigNum: any = { fontSize: '55px', textAlign: 'center', margin: '20px 0', fontWeight: 'bold' };
const battingBox: any = { display: 'flex', flexDirection: 'column', gap: '10px' };
const playerRow: any = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer' };
const bowlRow: any = { padding: '12px', background: 'rgba(245, 205, 17, 0.1)', borderRadius: '10px', color: '#f5cd11', cursor: 'pointer' };
const btnGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '20px' };
const numBtn: any = { padding: '20px', borderRadius: '12px', background: 'white', color: '#0f172a', fontWeight: 'bold', border: 'none' };
const exBtn: any = { background: '#f5cd11', color: 'black', borderRadius: '12px', border: 'none', fontWeight: 'bold' };
const wktBtn: any = { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold' };
const reset: any = { gridColumn: 'span 4', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '10px' };
const modalBg: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContent: any = { background: '#1e293b', padding: '20px', borderRadius: '15px', width: '85%', maxHeight: '80%', overflowY: 'auto' };
const playerItem: any = { padding: '15px', borderBottom: '1px solid #334155', cursor: 'pointer' };
const closeBtn: any = { width: '100%', padding: '12px', marginTop: '10px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white' };
