import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_NAME = "Touqeer Iqbal";
const ADMIN_DP = "https://i.ibb.co/vzYyLz7/touqeer.jpg"; 
const ADMIN_WA = "923015800630";

export default function AdhiKotProIntelligent() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<{type: string, teamKey: string} | null>(null);
  const [isSetup, setIsSetup] = useState(true);
  const [loading, setLoading] = useState(true);
  const [animation, setAnimation] = useState("");

  useEffect(() => {
    const unsub = onValue(ref(db, 'liveMatch'), (snap) => {
      const data = snap.val();
      if (data && data.teamA) {
        setMatch(data);
        setIsSetup(false);
      } else {
        setIsSetup(true);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const triggerAnimation = (text: string) => {
    setAnimation(text);
    setTimeout(() => setAnimation(""), 2500);
  };

  const handleStart = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string || "").split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }));
    const pB = (fd.get("pB") as string || "").split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }));

    const initialData = {
      league: fd.get("league") || "ADHI KOT LEAGUE",
      umpire: fd.get("umpire") || "Not Assigned",
      toss: fd.get("toss") || "TBD",
      oversTotal: parseInt(fd.get("overs") as string) || 5,
      teamA: { name: fd.get("tA"), players: pA },
      teamB: { name: fd.get("tB"), players: pB },
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1, target: null,
      striker: { name: "Select Striker", idx: -1 },
      nonStriker: { name: "Select Non-Striker", idx: -1 },
      bowler: { name: "Select Bowler" },
      status: "Live"
    };
    set(ref(db, 'liveMatch'), initialData);
  };

  const updateBall = (runs: number, type: string = "normal") => {
    if (!match || match.status === "Match Ended") return;
    if (match.striker.idx === -1) { alert("Please select a Batsman!"); return; }

    let m = { ...match };
    const batTeamKey = m.innings === 1 ? 'teamA' : 'teamB';

    if (type === "W") {
      m.wickets += 1;
      m.balls += 1;
      m[batTeamKey].players[m.striker.idx].balls += 1;
      m[batTeamKey].players[m.striker.idx].out = true;
      m.striker = { name: "Select Batsman", idx: -1 };
      triggerAnimation("☝️ OUT!");
    } else if (type === "WD" || type === "NB") {
      m.score += (1 + runs);
      if (type === "NB") triggerAnimation("🆓 Free Hit!");
    } else {
      m.score += runs;
      m.balls += 1;
      m[batTeamKey].players[m.striker.idx].runs += runs;
      m[batTeamKey].players[m.striker.idx].balls += 1;
      if (runs === 4) triggerAnimation("🏏 FOUR!");
      if (runs === 6) triggerAnimation("🚀 SIX!");
      if (runs % 2 !== 0) { let t = m.striker; m.striker = m.nonStriker; m.nonStriker = t; }
    }

    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
      let t = m.striker; m.striker = m.nonStriker; m.nonStriker = t;
      m.bowler.name = "Select Bowler";
    }

    // Intelligent Logic
    if (m.innings === 1 && (m.wickets >= m[batTeamKey].players.length - 1 || m.overs >= m.oversTotal)) {
      m.target = m.score + 1;
      m.innings = 2; m.score = 0; m.wickets = 0; m.balls = 0; m.overs = 0;
      m.striker = { name: "Select Striker", idx: -1 };
      m.nonStriker = { name: "Select Non-Striker", idx: -1 };
      triggerAnimation("✅ Target Set: " + m.target);
    } else if (m.innings === 2) {
      if (m.score >= m.target) { m.status = "Match Ended"; m.winMsg = "Chasing Team Won!"; }
      else if (m.wickets >= m[batTeamKey].players.length - 1 || m.overs >= m.oversTotal) {
        m.status = "Match Ended"; m.winMsg = "Defending Team Won!";
      }
    }
    set(ref(db, 'liveMatch'), m);
  };

  const selectPlayer = (role: string, player: any, i: number) => {
    let m = { ...match };
    if (role === 'striker') m.striker = { name: player.name, idx: i };
    if (role === 'nonStriker') m.nonStriker = { name: player.name, idx: i };
    if (role === 'bowler') m.bowler.name = player.name;
    set(ref(db, 'liveMatch'), m);
    setModal(null);
  };

  if (loading) return <div style={st.loader}>SYNCING...</div>;

  if (isSetup) return (
    <div style={st.sContainer}>
      <div style={st.sCard}>
        <img src={ADMIN_DP} style={st.sDP}/>
        <h2 style={st.sTitle}>ADHI KOT PRO SETUP</h2>
        <form onSubmit={handleStart} style={st.fStyle}>
          <input name="league" placeholder="League Name" style={st.inp} />
          <input name="overs" placeholder="Overs" type="number" style={st.inp} />
          <input name="tA" placeholder="Team A (Batting)" style={st.inp} />
          <textarea name="pA" placeholder="Team A Players (Ali, Ahmed...)" style={st.aArea} />
          <input name="tB" placeholder="Team B (Bowling)" style={st.inp} />
          <textarea name="pB" placeholder="Team B Players (Zaid, Khan...)" style={st.aArea} />
          <button type="submit" style={st.goBtn}>START MATCH</button>
        </form>
      </div>
    </div>
  );

  const curBat = match.innings === 1 ? 'teamA' : 'teamB';
  const curBowl = match.innings === 1 ? 'teamB' : 'teamA';

  return (
    <div style={st.appWrap}>
      <div style={st.header}>
        <span style={st.hText}>{match.league} | {ADMIN_NAME}</span>
        <a href={`https://wa.me/${ADMIN_WA}`} style={st.waBtn}>WhatsApp</a>
      </div>

      <div style={st.liveCard}>
        <div style={st.bigScore}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>
        {match.target && <div style={st.targetLine}>Target: {match.target} | {match.winMsg}</div>}
        
        <div style={st.playersBox}>
          <div style={st.row} onClick={()=>setModal({type:'striker', teamKey:curBat})}>🏏 {match.striker?.name}*</div>
          <div style={st.row} onClick={()=>setModal({type:'nonStriker', teamKey:curBat})}>🏏 {match.nonStriker?.name}</div>
          <div style={st.bowlBtn} onClick={()=>setModal({type:'bowler', teamKey:curBowl})}>⚪ {match.bowler?.name}</div>
        </div>
      </div>

      <div style={st.controlGrid}>
        {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => updateBall(n)} style={st.nBtn}>{n}</button>)}
        <button onClick={() => updateBall(0, "WD")} style={st.eBtn}>WD</button>
        <button onClick={() => updateBall(0, "NB")} style={st.eBtn}>NB</button>
        <button onClick={() => updateBall(0, "W")} style={st.wBtn}>WICKET</button>
      </div>

      <button onClick={() => remove(ref(db, 'liveMatch'))} style={st.delBtn}>End/Delete Match</button>

      {animation && <div style={st.overlayAni}>{animation}</div>}

      {modal && (
        <div style={st.modalBg} onClick={() => setModal(null)}>
          <div style={st.modalContent} onClick={e => e.stopPropagation()}>
            {match[modal.teamKey].players.map((p: any, i: number) => (
              <div key={i} onClick={() => selectPlayer(modal.type, p, i)} style={st.pItm}>{p.name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const st: any = {
  loader: { background: '#0a0f1e', color: '#f5cd11', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  sContainer: { background: '#0a0f1e', minHeight: '100vh', padding: '20px', color: 'white' },
  sCard: { background: '#161d31', padding: '20px', borderRadius: '20px', border: '2px solid #f5cd11' },
  sDP: { width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 10px', display: 'block' },
  sTitle: { textAlign: 'center', color: '#f5cd11', fontSize: '18px' },
  fStyle: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inp: { padding: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px' },
  aArea: { padding: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', minHeight: '50px' },
  goBtn: { background: '#f5cd11', padding: '12px', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  appWrap: { background: '#0a0f1e', minHeight: '100vh', color: 'white' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#161d31', borderBottom: '1px solid #f5cd11' },
  hText: { color: '#f5cd11', fontSize: '12px' },
  waBtn: { background: '#25D366', color: 'white', padding: '4px 10px', borderRadius: '15px', textDecoration: 'none', fontSize: '10px' },
  liveCard: { margin: '10px', padding: '15px', background: '#161d31', borderRadius: '20px' },
  bigScore: { fontSize: '45px', textAlign: 'center', fontWeight: 'bold' },
  targetLine: { textAlign: 'center', color: '#f5cd11', fontSize: '12px', margin: '5px 0' },
  playersBox: { display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#334155', borderRadius: '8px' },
  bowlBtn: { padding: '10px', background: 'rgba(245,205,17,0.1)', color: '#f5cd11', borderRadius: '8px', textAlign: 'center' },
  controlGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '10px' },
  nBtn: { padding: '15px', background: 'white', color: 'black', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  eBtn: { background: '#f5cd11', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  wBtn: { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' },
  delBtn: { width: '95%', margin: '10px auto', display: 'block', padding: '10px', background: '#334155', border: 'none', borderRadius: '8px', color: '#94a3b8' },
  overlayAni: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', color: '#f5cd11', zIndex: 100 },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { background: '#161d31', padding: '20px', borderRadius: '15px', width: '80%' },
  pItm: { padding: '12px', borderBottom: '1px solid #334155', textAlign: 'center' }
};
