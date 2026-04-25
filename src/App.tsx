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

const ADMIN = { name: "Touqeer Iqbal", dp: "https://i.ibb.co/vzYyLz7/touqeer.jpg", wa: "923015800630" };

export default function AdhiKotCricketIntelligent() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onValue(ref(db, 'liveMatch'), (snap) => {
      setMatch(snap.val());
      setLoading(false);
    });
  }, []);

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const pB = (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    const init = {
      teamA: { name: fd.get("tA"), players: pA },
      teamB: { name: fd.get("tB"), players: pB },
      toss: fd.get("toss"),
      umpire: fd.get("umpire"),
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1, target: null,
      striker: { name: "Select Striker", idx: -1 },
      nonStriker: { name: "Select Non-Striker", idx: -1 },
      bowler: { name: "Select Bowler" }
    };
    set(ref(db, 'liveMatch'), init);
  };

  // INTELLIGENT BUTTON LOGIC
  const updateScore = (runs: number, type: string = "normal") => {
    if (!match || match.striker.idx === -1) return alert("Select Players First!");

    let m = JSON.parse(JSON.stringify(match));
    const batKey = m.innings === 1 ? 'teamA' : 'teamB';

    if (type === "W") {
      m.wickets += 1; m.balls += 1;
      m[batKey].players[m.striker.idx].balls += 1;
      m.striker = { name: "New Batsman*", idx: -1 };
    } else if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs; m.balls += 1;
      m[batKey].players[m.striker.idx].runs += runs;
      m[batKey].players[m.striker.idx].balls += 1;
      if (runs % 2 !== 0) swap(m);
    }

    // Over logic & Auto Swap
    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
      swap(m);
      m.bowler.name = "Select Next Bowler";
    }

    // Auto Second Innings Logic
    if (m.wickets >= 10 && m.innings === 1) {
       alert("First Innings Over!");
       m.target = m.score + 1;
       m.innings = 2; m.score = 0; m.wickets = 0; m.balls = 0; m.overs = 0;
       m.striker = { name: "Select Striker", idx: -1 };
       m.nonStriker = { name: "Select Non-Striker", idx: -1 };
    }

    set(ref(db, 'liveMatch'), m);
  };

  const swap = (m: any) => { let t = m.striker; m.striker = m.nonStriker; m.nonStriker = t; };

  if (loading) return <div style={st.loader}>Syncing...</div>;
  if (!match) return (
    <div style={st.setupCont}>
      <div style={st.setupCard}>
        <img src={ADMIN.dp} style={st.setupDP} />
        <h2 style={{color:'#f5cd11', textAlign:'center'}}>ADHI KOT PRO SETUP</h2>
        <form onSubmit={startMatch} style={st.form}>
          <input name="tA" placeholder="Batting Team" required style={st.input} />
          <textarea name="pA" placeholder="Batsmen Names (Ali, Ahmed...)" required style={st.area} />
          <input name="tB" placeholder="Bowling Team" required style={st.input} />
          <textarea name="pB" placeholder="Bowlers Names (Zaid, Khan...)" required style={st.area} />
          <input name="toss" placeholder="Toss Details" style={st.input} />
          <input name="umpire" placeholder="Umpire" style={st.input} />
          <button type="submit" style={st.goBtn}>CREATE MATCH</button>
        </form>
      </div>
    </div>
  );

  const curBat = match.innings === 1 ? 'teamA' : 'teamB';
  const curBowl = match.innings === 1 ? 'teamB' : 'teamA';

  return (
    <div style={st.appWrap}>
      <div style={st.header}>
        <div style={{display:'flex', gap:'10px'}}>
            <img src={ADMIN.dp} style={st.miniDP} />
            <div><b style={{color:'#f5cd11'}}>ADHI KOT PRO</b><br/><small>{ADMIN.name}</small></div>
        </div>
        <a href={`https://wa.me/${ADMIN.wa}`} style={st.waBtn}>Help</a>
      </div>

      <div style={st.scoreZone}>
        <div style={st.vsLine}><span>{match.teamA.name}</span> VS <span>{match.teamB.name}</span></div>
        {match.target && <div style={st.target}>Target: {match.target}</div>}
        <div style={st.bigScore}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>
        
        <div style={st.pBox}>
          <div style={st.row} onClick={()=>setModal({type:'striker', key:curBat})}>
            🏏 {match.striker.name}* <span>{match.striker.idx!==-1?`${match[curBat].players[match.striker.idx].runs}(${match[curBat].players[match.striker.idx].balls})`:'0(0)'}</span>
          </div>
          <div style={st.row} onClick={()=>setModal({type:'nonStriker', key:curBat})}>
            🏏 {match.nonStriker.name} <span>{match.nonStriker.idx!==-1?`${match[curBat].players[match.nonStriker.idx].runs}(${match[curBat].players[match.nonStriker.idx].balls})`:'0(0)'}</span>
          </div>
          <div style={st.bowlRow} onClick={()=>setModal({type:'bowler', key:curBowl})}>🎾 {match.bowler.name}</div>
        </div>
      </div>

      <div style={st.btnGrid}>
        {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={st.nBtn}>{n}</button>)}
        <button onClick={()=>updateScore(0,"WD")} style={st.eBtn}>WD</button>
        <button onClick={()=>updateScore(0,"NB")} style={st.eBtn}>NB</button>
        <button onClick={()=>updateScore(0,"W")} style={st.wBtn}>WICKET</button>
        <button onClick={()=>set(ref(db, 'liveMatch'), null)} style={st.reset}>RESET</button>
      </div>

      {modal && (
        <div style={st.mBg} onClick={()=>setModal(null)}>
          <div style={st.mCnt} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:'#f5cd11'}}>Select {modal.type}</h3>
            {match[modal.key].players.map((p:any, i:number)=>(
              <div key={i} style={st.pItem} onClick={()=>{
                let m = {...match};
                if(modal.type==='striker') m.striker={name:p.name, idx:i};
                if(modal.type==='nonStriker') m.nonStriker={name:p.name, idx:i};
                if(modal.type==='bowler') m.bowler.name=p.name;
                set(ref(db, 'liveMatch'), m); setModal(null);
              }}>{p.name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const st: any = {
  loader: { background: '#0f172a', color: '#f5cd11', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  setupCont: { background: '#0f172a', minHeight: '100vh', padding: '20px' },
  setupCard: { background: '#1e293b', padding: '20px', borderRadius: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' },
  input: { padding: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '10px' },
  area: { padding: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '10px', minHeight: '60px' },
  goBtn: { background: '#f5cd11', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  setupDP: { width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #f5cd11', display: 'block', margin: '0 auto' },
  
  appWrap: { background: '#0f172a', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#1e293b', borderBottom: '2px solid #f5cd11' },
  miniDP: { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #f5cd11' },
  waBtn: { background: '#25D366', padding: '5px 15px', borderRadius: '20px', textDecoration: 'none', color: '#fff', fontSize: '12px' },
  
  scoreZone: { margin: '15px', padding: '20px', background: 'linear-gradient(to bottom, #1e293b, #0f172a)', borderRadius: '25px', border: '1px solid #334155' },
  vsLine: { display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontWeight: 'bold' },
  bigScore: { fontSize: '55px', textAlign: 'center', fontWeight: 'bold', margin: '10px 0' },
  target: { textAlign: 'center', color: '#f5cd11', fontSize: '14px', fontWeight: 'bold' },
  pBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },
  bowlRow: { padding: '12px', background: 'rgba(245,205,17,0.1)', color: '#f5cd11', borderRadius: '12px', textAlign: 'center', border: '1px solid #f5cd11' },
  
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '15px' },
  nBtn: { padding: '20px', borderRadius: '15px', background: '#fff', color: '#000', fontWeight: 'bold', border: 'none', fontSize: '18px' },
  eBtn: { background: '#f5cd11', borderRadius: '15px', border: 'none', fontWeight: 'bold' },
  wBtn: { gridColumn: 'span 2', background: '#ef4444', color: '#fff', borderRadius: '15px', border: 'none', fontWeight: 'bold' },
  reset: { gridColumn: 'span 4', background: '#334155', color: '#94a3b8', padding: '10px', border: 'none', borderRadius: '10px' },
  
  mBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  mCnt: { background: '#1e293b', padding: '20px', borderRadius: '20px', width: '85%', maxHeight: '70%', overflowY: 'auto' },
  pItem: { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center' }
};
