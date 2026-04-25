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

// FIXED ADMIN DATA - App ke andar permanent
const ADMIN_NAME = "Touqeer Iqbal";
const ADMIN_DP = "https://i.ibb.co/vzYyLz7/touqeer.jpg"; 
const ADMIN_WA = "923015800630";

export default function AdhiKotProFinal() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<{type: string, team: 'teamA' | 'teamB'} | null>(null);
  const [setup, setSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'liveMatch'), (snap) => {
      const val = snap.val();
      if (val) {
        setMatch(val);
        setSetup(false);
      } else {
        setSetup(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStart = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const pB = (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    const data = {
      tA: { name: fd.get("tA"), players: pA },
      tB: { name: fd.get("tB"), players: pB },
      score: 0, wickets: 0, balls: 0, overs: 0,
      striker: { name: "Select Striker", idx: -1 },
      nonStriker: { name: "Select Non-Striker", idx: -1 },
      bowler: { name: "Select Bowler" },
      innings: 1
    };
    set(ref(db, 'liveMatch'), data);
  };

  const addScore = (r: number, type = "") => {
    if (!match || match.striker.idx === -1 || match.nonStriker.idx === -1) {
      alert("Pehle Striker aur Non-Striker select karein!");
      return;
    }
    let m = JSON.parse(JSON.stringify(match));
    const batKey = m.innings === 1 ? 'tA' : 'tB';

    if (type === "W") {
      m.wickets += 1;
      m.balls += 1;
      m[batKey].players[m.striker.idx].balls += 1;
      m.striker = { name: "Select New Batsman", idx: -1 };
    } else if (type === "WD" || type === "NB") {
      m.score += (r + 1);
    } else {
      m.score += r;
      m.balls += 1;
      m[batKey].players[m.striker.idx].runs += r;
      m[batKey].players[m.striker.idx].balls += 1;
      if (r % 2 !== 0) {
        let tmp = m.striker; m.striker = m.nonStriker; m.nonStriker = tmp;
      }
    }

    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
      let tmp = m.striker; m.striker = m.nonStriker; m.nonStriker = tmp;
      m.bowler.name = "Select Bowler";
    }
    set(ref(db, 'liveMatch'), m);
  };

  if (setup) return (
    <div style={sPage}>
      <div style={sCard}>
        <img src={ADMIN_DP} style={adImg} />
        <h2 style={{textAlign:'center'}}>{ADMIN_NAME} Setup</h2>
        <form onSubmit={handleStart} style={fStyle}>
          <input name="tA" placeholder="Team A Name" required style={inp} />
          <textarea name="pA" placeholder="Team A Players (Ali, Ahmed...)" required style={inp} />
          <input name="tB" placeholder="Team B Name" required style={inp} />
          <textarea name="pB" placeholder="Team B Players (Zaid, Bakr...)" required style={inp} />
          <button type="submit" style={sBtn}>START MATCH</button>
        </form>
      </div>
    </div>
  );

  // Crash preventer: agar match null ho
  if (!match) return <div style={{color:'white'}}>Loading...</div>;

  const currentBatTeam = match.innings === 1 ? match.tA : match.tB;

  return (
    <div style={appBg}>
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={ADMIN_DP} style={{width:'35px', height:'35px', borderRadius:'50%'}} />
          <span style={{color:'#f5cd11', fontWeight:'bold'}}>{ADMIN_NAME} PRO</span>
        </div>
        <a href={`https://wa.me/${ADMIN_WA}`} style={waB}>WhatsApp</a>
      </div>

      <div style={scoreC}>
        <div style={vs}><span>{match.tA.name}</span> <small>vs</small> <span>{match.tB.name}</span></div>
        <div style={scr}>{match.score}/{match.wickets} <small style={{fontSize:'20px'}}>({match.overs}.{match.balls})</small></div>
        
        <div style={pArea}>
          <div style={pBox} onClick={() => setModal({type:'striker', team: match.innings === 1 ? 'teamA' : 'teamB'})}>
            🏏 {match.striker.name}* <span>{match.striker.idx !== -1 ? `${currentBatTeam.players[match.striker.idx].runs}(${currentBatTeam.players[match.striker.idx].balls})` : "0(0)"}</span>
          </div>
          <div style={pBox} onClick={() => setModal({type:'nonStriker', team: match.innings === 1 ? 'teamA' : 'teamB'})}>
            🏏 {match.nonStriker.name}
            <span>{match.nonStriker.idx !== -1 ? `${currentBatTeam.players[match.nonStriker.idx].runs}(${currentBatTeam.players[match.nonStriker.idx].balls})` : "0(0)"}</span>
          </div>
          <div style={bBox} onClick={() => setModal({type:'bowler', team: match.innings === 1 ? 'teamB' : 'teamA'})}>
            🎾 {match.bowler.name}
          </div>
        </div>
      </div>

      <div style={grid}>
        {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => addScore(n)} style={nB}>{n}</button>)}
        <button onClick={() => addScore(0, "WD")} style={eB}>WD</button>
        <button onClick={() => addScore(0, "NB")} style={eB}>NB</button>
        <button onClick={() => addScore(0, "W")} style={wB}>WICKET</button>
        <button onClick={() => set(ref(db, 'liveMatch'), null)} style={rB}>Reset Match</button>
      </div>

      {modal && (
        <div style={mBg}>
          <div style={mCnt}>
            <h3>Select Player</h3>
            {(modal.team === 'teamA' ? match.tA.players : match.tB.players).map((p: any, i: number) => (
              <div key={i} onClick={() => {
                let m = {...match};
                if(modal.type === 'striker') m.striker = {name: p.name, idx: i};
                if(modal.type === 'nonStriker') m.nonStriker = {name: p.name, idx: i};
                if(modal.type === 'bowler') m.bowler.name = p.name;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }} style={pItm}>{p.name}</div>
            ))}
            <button onClick={() => setModal(null)} style={clB}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS Styles
const sPage: any = { background: '#0f172a', minHeight: '100vh', padding: '20px', display: 'flex', justifyContent: 'center' };
const sCard: any = { background: '#1e293b', padding: '20px', borderRadius: '15px', width: '100%', maxWidth: '400px', color: 'white' };
const adImg: any = { width: '70px', height: '70px', borderRadius: '50%', display: 'block', margin: '0 auto 15px', border: '2px solid #f5cd11' };
const fStyle: any = { display: 'flex', flexDirection: 'column', gap: '10px' };
const inp: any = { padding: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px' };
const sBtn: any = { background: '#f5cd11', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' };
const appBg: any = { background: '#0f172a', minHeight: '100vh', color: 'white' };
const header: any = { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#1e293b', borderBottom: '2px solid #f5cd11' };
const waB: any = { background: '#22c55e', color: 'white', padding: '6px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px' };
const scoreC: any = { margin: '15px', padding: '20px', background: '#1e293b', borderRadius: '20px', border: '1px solid #334155' };
const vs: any = { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#94a3b8' };
const scr: any = { fontSize: '55px', textAlign: 'center', margin: '15px 0', fontWeight: 'bold' };
const pArea: any = { display: 'flex', flexDirection: 'column', gap: '8px' };
const pBox: any = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#334155', borderRadius: '10px' };
const bBox: any = { padding: '12px', background: 'rgba(245,205,17,0.1)', borderRadius: '10px', color: '#f5cd11', border: '1px solid #f5cd11' };
const grid: any = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '15px' };
const nB: any = { padding: '20px 0', background: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '18px' };
const eB: any = { background: '#f5cd11', borderRadius: '10px', border: 'none', fontWeight: 'bold' };
const wB: any = { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold' };
const rB: any = { gridColumn: 'span 4', background: '#334155', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', marginTop: '10px' };
const mBg: any = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const mCnt: any = { background: '#1e293b', padding: '20px', borderRadius: '15px', width: '85%' };
const pItm: any = { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center' };
const clB: any = { width: '100%', padding: '12px', marginTop: '10px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white' };
