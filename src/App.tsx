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

// SAFE ADMIN DATA
const ADMIN = {
  name: "Touqeer Iqbal",
  dp: "https://via.placeholder.com/150", // Default image if yours fails
  wa: "923015800630"
};

export default function AdhiKotCricketFinal() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<{type: string, team: string} | null>(null);
  const [isSetup, setIsSetup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsubscribe = onValue(matchRef, (snap) => {
      const data = snap.val();
      if (data && data.teamA) {
        setMatch(data);
        setIsSetup(false);
      } else {
        setIsSetup(true);
      }
      setIsLoading(false);
    }, (error) => {
      console.error(error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    const playersA = (fd.get("pA") as string || "").split(",").filter(n => n.trim()).map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const playersB = (fd.get("pB") as string || "").split(",").filter(n => n.trim()).map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    if(playersA.length === 0 || playersB.length === 0) return alert("Players ke naam likhna zaroori hain!");

    const init = {
      teamA: { name: fd.get("tA") || "Team A", players: playersA },
      teamB: { name: fd.get("tB") || "Team B", players: playersB },
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
    if (!match || match.wickets >= 10) return;
    if (match.striker.idx === -1 || match.nonStriker.idx === -1) return alert("Batsmen select karein!");

    let m = JSON.parse(JSON.stringify(match));
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
      if (runs % 2 !== 0) {
        let temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    if (m.balls >= 6) { 
        m.overs += 1; 
        m.balls = 0; 
        let temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
        m.bowler.name = "Select Bowler"; 
    }
    set(ref(db, 'liveMatch'), m);
  };

  if (isLoading) return <div style={{color:'white', textAlign:'center', padding:'50px'}}>Loading Adhi Kot Pro...</div>;

  if (isSetup) {
    return (
      <div style={setupCont}>
        <div style={setupCard}>
          <h2 style={{textAlign:'center', color:'#f5cd11'}}>Touqeer Iqbal Setup</h2>
          <form onSubmit={startMatch} style={form}>
            <input name="tA" placeholder="Team A (Batting First)" required style={input} />
            <textarea name="pA" placeholder="Team A Players (Ali, Ahmed, etc.)" required style={area} />
            <input name="tB" placeholder="Team B (Bowling First)" required style={input} />
            <textarea name="pB" placeholder="Team B Players (Zaid, Bakr, etc.)" required style={area} />
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
        <span style={headText}>ADHI KOT CRICKET PRO</span>
        <a href={`https://wa.me/${ADMIN.wa}`} style={waBtn}>WhatsApp</a>
      </div>

      <div style={scoreZone}>
        <div style={vsLine}>
          <span>{match.teamA.name}</span>
          <span style={{color:'#f5cd11'}}>VS</span>
          <span>{match.teamB.name}</span>
        </div>

        <div style={bigNum}>{match.score}/{match.wickets} <small style={{fontSize:'20px'}}>({match.overs}.{match.balls})</small></div>

        <div style={battingBox}>
          <div style={playerRow} onClick={() => setModal({type:'striker', team:batTeamKey})}>
            🏏 {match.striker.name}* <span>{match.striker.idx !== -1 ? `${match[batTeamKey].players[match.striker.idx].runs}(${match[batTeamKey].players[match.striker.idx].balls})` : "0(0)"}</span>
          </div>
          <div style={playerRow} onClick={() => setModal({type:'nonStriker', team:batTeamKey})}>
            🏏 {match.nonStriker.name} 
            <span>{match.nonStriker.idx !== -1 ? `${match[batTeamKey].players[match.nonStriker.idx].runs}(${match[batTeamKey].players[match.nonStriker.idx].balls})` : "0(0)"}</span>
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
        <button onClick={() => {if(window.confirm("Match Reset?")) set(ref(db, 'liveMatch'), null);}} style={reset}>Reset Match</button>
      </div>

      {modal && (
        <div style={modalBg}>
          <div style={modalContent}>
            <h3 style={{marginBottom:'15px'}}>Select Player</h3>
            {(match[modal.team]?.players || []).map((p: any, i: number) => (
              <div key={i} onClick={() => {
                let m = {...match};
                if (modal.type === 'striker') m.striker = {name: p.name, idx: i};
                if (modal.type === 'nonStriker') m.nonStriker = {name: p.name, idx: i};
                if (modal.type === 'bowler') m.bowler.name = p.name;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }} style={playerItem}>{p.name}</div>
            ))}
            <button onClick={() => setModal(null)} style={closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES (Fixed for Blank Screen Prevention)
const setupCont: any = { background: '#111827', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '20px' };
const setupCard: any = { background: '#1f2937', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '400px', height: 'fit-content' };
const form: any = { display: 'flex', flexDirection: 'column', gap: '15px' };
const input: any = { padding: '12px', borderRadius: '8px', border: '1px solid #374151', background: '#111827', color: 'white' };
const area: any = { padding: '12px', borderRadius: '8px', border: '1px solid #374151', background: '#111827', color: 'white', minHeight: '100px' };
const goBtn: any = { background: '#f5cd11', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const appWrap: any = { background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' };
const header: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#1e293b', borderBottom: '2px solid #f5cd11' };
const headText: any = { fontWeight: 'bold', color: '#f5cd11', fontSize: '18px' };
const waBtn: any = { background: '#22c55e', color: 'white', padding: '8px 15px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px' };
const scoreZone: any = { margin: '15px', padding: '20px', background: '#1e293b', borderRadius: '20px', border: '1px solid #334155' };
const vsLine: any = { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' };
const bigNum: any = { fontSize: '60px', textAlign: 'center', fontWeight: 'bold', margin: '15px 0' };
const battingBox: any = { display: 'flex', flexDirection: 'column', gap: '8px' };
const playerRow: any = { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#334155', borderRadius: '10px' };
const bowlRow: any = { padding: '15px', background: 'rgba(245, 205, 17, 0.1)', borderRadius: '10px', color: '#f5cd11', border: '1px solid #f5cd11' };
const btnGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '15px' };
const numBtn: any = { padding: '20px 0', borderRadius: '10px', background: 'white', color: '#0f172a', fontWeight: 'bold', border: 'none', fontSize: '18px' };
const exBtn: any = { background: '#f5cd11', borderRadius: '10px', border: 'none', fontWeight: 'bold' };
const wktBtn: any = { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold' };
const reset: any = { gridColumn: 'span 4', background: '#374151', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', marginTop: '10px' };
const modalBg: any = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 };
const modalContent: any = { background: '#1e293b', padding: '20px', borderRadius: '15px', width: '85%' };
const playerItem: any = { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center' };
const closeBtn: any = { width: '100%', padding: '12px', marginTop: '10px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white' };
