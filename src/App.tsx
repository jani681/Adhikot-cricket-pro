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

// TOUQEER IQBAL PERMANENT DATA (Safe DP image for no blank screen)
const ADMIN_NAME = "Touqeer Iqbal";
const ADMIN_DP = "https://i.ibb.co/vzYyLz7/touqeer.jpg"; // Updated Touqeer Bhai's profile photo link
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
      if (data && data.innings) {
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
    setTimeout(() => setAnimation(""), 2500); // 2.5 seconds show
  };

  const handleStart = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    // Players Parsing (Safe split)
    const pA = (fd.get("pA") as string || "").split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }));
    const pB = (fd.get("pB") as string || "").split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0, out: false }));

    if (pA.length === 0 || pB.length === 0) return alert("At least add one player!");

    const oversTotal = parseInt(fd.get("overs") as string) || 5;

    const initialData = {
      league: fd.get("league") || "ADHI KOT LEAGUE",
      umpire: fd.get("umpire") || "Not Assigned",
      toss: fd.get("toss") || "TBD",
      oversTotal,
      teamA: { name: fd.get("tA"), players: pA, wins: 0, losses: 0 },
      teamB: { name: fd.get("tB"), players: pB, wins: 0, losses: 0 },
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
    if (match.striker.idx === -1) { alert("Please select a Batsman first!"); return; }

    let m = { ...match };
    const batKey = m.innings === 1 ? 'teamA' : 'teamB';

    if (type === "W") {
      m.wickets += 1;
      m.balls += 1;
      m[batKey].players[m.striker.idx].balls += 1;
      m[batKey].players[m.striker.idx].out = true;
      m.striker = { name: "New Batsman", idx: -1 };
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
      if (runs % 2 !== 0) swap(m);
    }

    // Over and Swapping Logic
    if (m.balls >= 6) {
      m.overs += 1;
      m.balls = 0;
      swap(m);
      m.bowler.name = "Select Bowler";
    }

    // INTELLIGENT MATCH MANAGEMENT

    // Innings 1 End (Wickets or Overs complete)
    if (m.innings === 1 && (m.wickets >= m[batTeamKey].players.length - 1 || m.overs >= m.oversTotal)) {
        triggerAnimation("✅ Innings Break");
        m.target = m.score + 1;
        m.innings = 2; m.score = 0; m.wickets = 0; m.balls = 0; m.overs = 0;
        m.striker = { name: "Select Striker", idx: -1 };
        m.nonStriker = { name: "Select Non-Striker", idx: -1 };
    }

    // Innings 2 Win/Loss Logic
    else if (m.innings === 2) {
        if (m.score >= m.target) {
            triggerAnimation("🏆 Match Ended");
            m.status = "Match Ended"; m.winTeam = m.battingTeam === 'A' ? m.teamA.name : m.teamB.name;
        } else if (m.wickets >= m[batTeamKey].players.length - 1 || m.overs >= m.oversTotal) {
            triggerAnimation("🏆 Match Ended");
            m.status = "Match Ended"; m.winTeam = m.battingTeam === 'A' ? m.teamB.name : m.teamA.name;
        }
    }

    set(ref(db, 'liveMatch'), m);
  };

  const swap = (m: any) => { let temp = m.striker; m.striker = m.nonStriker; m.nonStriker = temp; };

  const selectPlayer = (role: string, player: any, i: number) => {
    let m = { ...match };
    if (role === 'striker') m.striker = { name: player.name, idx: i };
    if (role === 'nonStriker') m.nonStriker = { name: player.name, idx: i };
    if (role === 'bowler') m.bowler.name = player.name;
    set(ref(db, 'liveMatch'), m);
    setModal(null);
  };

  if (loading) return <div style={st.loader}>SYNCING WITH ADHI KOT SERVER...</div>;

  if (isSetup) return (
    <div style={st.sContainer}>
      <div style={st.sCard}>
        <img src={ADMIN_DP} style={st.sDP} onError={(e:any)=>e.target.src='https://via.placeholder.com/150'}/>
        <h1 style={st.sTitle}>MATCH SETUP & TOURNAMENT</h1>
        <form onSubmit={handleStart} style={st.fStyle}>
          <input name="league" placeholder="League/Tournament Name" style={st.inp} />
          <input name="umpire" placeholder="Umpire Name" style={st.inp} />
          <input name="overs" placeholder="Total Overs (e.g., 5)" type="number" required style={st.inp} />
          <input name="toss" placeholder="Toss: Won by Team A, Batting first" style={st.inp} />
          <input name="tA" placeholder="Batting Team (Team A)" required style={st.inp} />
          <textarea name="pA" placeholder="Batsmen (Comma separated: Ali, Ahmed, Khan...)" required style={st.aArea} />
          <input name="tB" placeholder="Bowling Team (Team B)" required style={st.inp} />
          <textarea name="pB" placeholder="Bowlers (Comma separated: Jani, Rafi, Umar...)" required style={st.aArea} />
          <button type="submit" style={st.goBtn}>START INTELLIGENT MATCH</button>
        </form>
      </div>
    </div>
  );

  const curBat = match.innings === 1 ? 'teamA' : 'teamB';
  const curBowl = match.innings === 1 ? 'teamB' : 'teamA';

  return (
    <div style={st.appWrap}>
      {/* HEADER WITH FIXED ADMIN DATA */}
      <div style={st.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={ADMIN_DP} style={st.hDP} onError={(e:any)=>e.target.src='https://via.placeholder.com/40'}/>
          <span style={st.hText}>TOUQEER IQBAL PRO | {match.league}</span>
        </div>
        <a href={`https://wa.me/${ADMIN_WA}`} style={st.waBtn}> WhatsApp </a>
      </div>

      <div style={st.liveCard}>
        <div style={st.vsLine}><span>{match.teamA.name}</span> VS <span>{match.teamB.name}</span></div>
        <div style={st.umpireRow}>Umpire: {match.umpire} | Toss: {match.toss} | Match: {match.oversTotal} Ov</div>
        
        {match.target && <div style={st.targetLine}>{match.winTeam ? `🏆 Match End! ${match.winTeam} WON!` : `Target: ${match.target}`}</div>}
        
        <div style={st.bigScore}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>

        <div style={st.playersBox}>
          <div style={st.row} onClick={()=>setModal({type:'striker', teamKey:curBat})}>🏏 {match.striker.name}* <span>{match.striker.idx !== -1 ? `${match[batTeamKey].players[match.striker.idx].runs}(${match[batTeamKey].players[match.striker.idx].balls})` : "0(0)"}</span></div>
          <div style={st.row} onClick={()=>setModal({type:'nonStriker', teamKey:curBat})}>🏏 {match.nonStriker.name} <span>{match.nonStriker.idx !== -1 ? `${match[batTeamKey].players[match.nonStriker.idx].runs}(${match[batTeamKey].players[match.nonStriker.idx].balls})` : "0(0)"}</span></div>
          <div style={st.bowlBtn} onClick={()=>setModal({type:'bowler', teamKey:curBowl})}>⚪ {match.bowler.name}</div>
        </div>
      </div>

      {match.status === "Match Ended" ? (
        <div style={st.endPanel}>
            <button onClick={() => {if(confirm("Match Reset?")) set(ref(db, 'liveMatch'), null);}} style={st.resetFinal}>Match Setup</button>
            <button onClick={() => remove(ref(db, 'liveMatch'))} style={st.deleteFinal}>Delete Match Data</button>
        </div>
      ) : (
        <div style={st.controlGrid}>
            {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => updateBall(n)} style={st.nBtn}>{n}</button>)}
            <button onClick={() => updateBall(0, "WD")} style={st.eBtn}>WD</button>
            <button onClick={() => updateBall(0, "NB")} style={st.eBtn}>NB</button>
            <button onClick={() => updateBall(0, "W")} style={st.wBtn}>WICKET</button>
        </div>
      )}

      {animation && <div style={st.overlayAni}>{animation}</div>}

      {modal && (
        <div style={st.modalBg} onClick={() => setModal(null)}>
          <div style={st.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={st.modalTitle}>Select Player ({modal.teamKey === 'teamA' ? match.teamA.name : match.teamB.name})</h3>
            {match[modal.teamKey].players.map((p: any, i: number) => (
              <div key={i} onClick={() => selectPlayer(modal.type, p, i)} style={st.pItm}>{p.name}</div>
            ))}
            <button onClick={() => setModal(null)} style={st.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const st: any = {
  loader: { background: '#0a0f1e', color: '#f5cd11', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  sContainer: { background: '#0a0f1e', minHeight: '100vh', padding: '20px', color: 'white' },
  sCard: { background: '#161d31', padding: '20px', borderRadius: '20px', border: '2px solid #f5cd11' },
  sDP: { width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #f5cd11', display: 'block', margin: '0 auto 15px' },
  sTitle: { textAlign: 'center', color: '#f5cd11', marginBottom: '20px' },
  fStyle: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inp: { padding: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px' },
  aArea: { padding: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', minHeight: '60px' },
  goBtn: { background: '#f5cd11', padding: '15px', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  appWrap: { background: '#0a0f1e', minHeight: '100vh', color: 'white' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#161d31', borderBottom: '2px solid #f5cd11' },
  hDP: { width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #f5cd11' },
  hText: { color: '#f5cd11', fontSize: '13px', fontWeight: 'bold' },
  waBtn: { background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '11px' },
  liveCard: { margin: '15px', padding: '15px', background: 'linear-gradient(to bottom, #161d31, #0a0f1e)', borderRadius: '25px', border: '1px solid #334155' },
  vsLine: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#94a3b8' },
  umpireRow: { fontSize: '10px', color: '#cbd5e1', textAlign: 'center', margin: '8px 0' },
  targetLine: { textAlign: 'center', color: '#f5cd11', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' },
  bigScore: { fontSize: '55px', textAlign: 'center', fontWeight: 'bold' },
  playersBox: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#334155', borderRadius: '10px' },
  bowlBtn: { padding: '12px', background: 'rgba(245,205,17,0.1)', color: '#f5cd11', borderRadius: '10px', textAlign: 'center' },
  controlGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '15px' },
  nBtn: { padding: '20px', background: 'white', color: '#0a0f1e', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '18px' },
  eBtn: { background: '#f5cd11', color: 'black', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
  wBtn: { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
  endPanel: { display: 'flex', gap: '10px', padding: '15px' },
  resetFinal: { flex: 1, background: '#f5cd11', border: 'none', borderRadius: '10px', padding: '12px' },
  deleteFinal: { flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '12px' },
  overlayAni: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', fontWeight: '900', color: '#f5cd11', zIndex: 1000, textShadow: '2px 2px 10px black' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { background: '#161d31', padding: '20px', borderRadius: '15px', width: '85%' },
  modalTitle: { color: '#f5cd11', marginBottom: '10px' },
  pItm: { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center' },
  closeBtn: { width: '100%', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', marginTop: '10px' }
};
