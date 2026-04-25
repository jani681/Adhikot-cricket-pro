import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fixed Admin Details
const ADMIN_NAME = "Touqeer Iqbal Baghoor";
const ADMIN_WA = "923015800630";
const ADMIN_IMAGE = "https://i.ibb.co/Vpgm8S1/touqeer.jpg"; // Ye link permanent hai

export default function AdhiKotCricketPro() {
  const [match, setMatch] = useState<any>(null);
  const [view, setView] = useState<'live' | 'setup' | 'history'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [modal, setModal] = useState<{type: string, list: any[]} | null>(null);

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleCreateMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    const parsePlayers = (str: string) => str.split(",").map(p => ({
      name: p.trim(), wa: "923XXXXXXXXX", r: 0, b: 0, f: 0, s: 0, d: 0
    }));

    const newMatch = {
      tA: fd.get("tA"), tB: fd.get("tB"),
      pA: parsePlayers(fd.get("pA") as string),
      pB: parsePlayers(fd.get("pB") as string),
      batTeam: fd.get("tA"),
      score: 0, wkts: 0, balls: 0, ovs: 0, target: 0, inning: 1,
      striker: null, nonStriker: null, bowler: null,
      umpire: fd.get("um"), ground: fd.get("gd")
    };
    set(ref(db, 'liveMatch'), newMatch);
    setView('live');
  };

  const updateScore = (r: number, type = "n") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    
    if (type === "W") {
      m.wkts += 1; m.balls += 1; m.striker.b += 1; m.striker = null;
    } else if (type === "WD" || type === "NB") {
      m.score += (r + 1);
    } else {
      m.score += r; m.balls += 1;
      m.striker.r += r; m.striker.b += 1;
      if (r === 4) m.striker.f += 1;
      if (r === 6) m.striker.s += 1;
      if (r % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if (m.balls === 6) { m.ovs += 1; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
  };

  const sendWAUpdate = (player: any) => {
    const text = `🔥 *Live Match Update* 🔥%0A🏏 ${match.tA} vs ${match.tB}%0A📊 Score: ${match.score}/${match.wkts} (${match.ovs}.${match.balls})%0A🌟 ${player.name}: ${player.r}(${player.b})%0A🚩 Target: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/${player.wa}?text=${text}`, '_blank');
  };

  const calculateRR = () => {
    const totalBalls = (match.ovs * 6) + match.balls;
    return totalBalls > 0 ? ((match.score / totalBalls) * 6).toFixed(2) : "0.00";
  };

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div style={styles.adminRow}>
          <img src={ADMIN_IMAGE} style={styles.adminDp} alt="Admin" />
          <div style={{flex:1}}>
            <div style={styles.adminName}>{ADMIN_NAME}</div>
            <div style={styles.status}>● Admin Online</div>
          </div>
          <a href={`https://wa.me/${ADMIN_WA}`} style={styles.waIconHeader}>📞</a>
        </div>
        <div style={styles.tabs}>
          <button onClick={()=>setView('live')} style={styles.tab}>Live</button>
          <button onClick={()=>setView('history')} style={styles.tab}>History</button>
          <button onClick={()=>setIsAdmin(!isAdmin)} style={isAdmin ? styles.adminOn : styles.tab}>
            {isAdmin ? "Admin Mode" : "Login"}
          </button>
        </div>
      </div>

      {/* SETUP VIEW */}
      {view === 'live' && isAdmin && !match && (
        <button onClick={()=>setView('setup')} style={styles.setupBtn}>+ START NEW MATCH</button>
      )}

      {view === 'setup' && (
        <form onSubmit={handleCreateMatch} style={styles.form}>
          <input name="tA" placeholder="Batting Team Name" style={styles.input} />
          <textarea name="pA" placeholder="Team A Players (Comma separated)" style={styles.area} />
          <input name="tB" placeholder="Bowling Team Name" style={styles.input} />
          <textarea name="pB" placeholder="Team B Players (Comma separated)" style={styles.area} />
          <input name="gd" placeholder="Ground Name" style={styles.input} />
          <input name="um" placeholder="Umpire Name" style={styles.input} />
          <button type="submit" style={styles.createBtn}>CREATE MATCH</button>
        </form>
      )}

      {/* LIVE SCORECARD */}
      {view === 'live' && match && (
        <div style={styles.scorecard}>
          <div style={styles.matchMeta}>{match.ground} | Umpire: {match.umpire}</div>
          <div style={styles.mainScore}>{match.score}/{match.wkts} <small style={{fontSize:'18px'}}>({match.ovs}.{match.balls})</small></div>
          <div style={styles.rrBox}>RR: {calculateRR()} {match.target > 0 && `| Req: ${((match.target-match.score)/((30-((match.ovs*6)+match.balls))/6)).toFixed(2)}`}</div>

          {/* PLAYER SELECTION BUTTONS */}
          <div style={styles.playerSection}>
            <div style={styles.playerRow} onClick={() => isAdmin && setModal({type: 'striker', list: match.pA})}>
              <span>🏏 {match.striker ? `${match.striker.name}*` : 'Select Striker'}</span>
              <span>{match.striker ? `${match.striker.r}(${match.striker.b})` : '0(0)'}</span>
              {match.striker && <span onClick={(e)=>{e.stopPropagation(); sendWAUpdate(match.striker)}} style={styles.waTiny}>📞</span>}
            </div>
            <div style={styles.playerRow} onClick={() => isAdmin && setModal({type: 'nonStriker', list: match.pA})}>
              <span>🏏 {match.nonStriker ? match.nonStriker.name : 'Select Non-Striker'}</span>
              <span>{match.nonStriker ? `${match.nonStriker.r}(${match.nonStriker.b})` : '0(0)'}</span>
              {match.nonStriker && <span onClick={(e)=>{e.stopPropagation(); sendWAUpdate(match.nonStriker)}} style={styles.waTiny}>📞</span>}
            </div>
            <div style={styles.playerRow} style={{background:'#1e293b'}} onClick={() => isAdmin && setModal({type: 'bowler', list: match.pB})}>
              <span>🎾 {match.bowler ? match.bowler.name : 'Select Bowler'}</span>
              <span>Bowler</span>
            </div>
          </div>

          {/* ADMIN CONTROLS */}
          {isAdmin && (
            <div style={styles.controls}>
              <div style={styles.grid}>
                {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={styles.btn}>{n}</button>)}
                <button onClick={()=>updateScore(0,"WD")} style={styles.exBtn}>WD</button>
                <button onClick={()=>updateScore(0,"NB")} style={styles.exBtn}>NB</button>
              </div>
              <button onClick={()=>updateScore(0,"W")} style={styles.wktBtn}>WICKET OUT</button>
              <button onClick={()=>{
                 if(match.inning === 1) { 
                   let m={...match}; m.target=m.score+1; m.inning=2; m.score=0; m.wkts=0; m.ovs=0; m.balls=0;
                   m.striker=null; m.nonStriker=null; [m.pA, m.pB] = [m.pB, m.pA]; [m.tA, m.tB] = [m.tB, m.tA];
                   set(ref(db, 'liveMatch'), m);
                 } else { remove(ref(db, 'liveMatch')); }
              }} style={styles.endBtn}>{match.inning===1 ? "END 1ST INNING" : "FINISH MATCH"}</button>
            </div>
          )}
        </div>
      )}

      {/* FULL TEAM SELECTION MODAL */}
      {modal && (
        <div style={styles.modalBg}>
          <div style={styles.modalContent}>
            <h3>Select {modal.type}</h3>
            {modal.list.map((p, i) => (
              <div key={i} style={styles.listP} onClick={() => {
                let m = {...match};
                if(modal.type==='striker') m.striker = p;
                if(modal.type==='nonStriker') m.nonStriker = p;
                if(modal.type==='bowler') m.bowler = p;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }}>{p.name}</div>
            ))}
            <button onClick={()=>setModal(null)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#1e293b', padding: '15px', borderBottom: '2px solid #eab308' },
  adminRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
  adminDp: { width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #eab308', objectFit: 'cover' },
  adminName: { fontWeight: 'bold', fontSize: '16px' },
  status: { fontSize: '10px', color: '#22c55e' },
  waIconHeader: { background: '#22c55e', color: 'white', padding: '8px', borderRadius: '50%', textDecoration: 'none' },
  tabs: { display: 'flex', gap: '10px' },
  tab: { background: '#334155', border: 'none', color: 'white', padding: '6px 15px', borderRadius: '5px' },
  adminOn: { background: '#eab308', color: 'black', fontWeight: 'bold', border: 'none', padding: '6px 15px', borderRadius: '5px' },
  scorecard: { margin: '15px', padding: '20px', background: '#1e293b', borderRadius: '20px' },
  mainScore: { fontSize: '50px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' },
  rrBox: { textAlign: 'center', color: '#eab308', marginBottom: '20px', fontSize: '14px' },
  playerSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  playerRow: { background: '#0f172a', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  waTiny: { background: '#22c55e', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '20px' },
  btn: { padding: '15px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px' },
  exBtn: { background: '#eab308', fontWeight: 'bold', border: 'none', borderRadius: '8px' },
  wktBtn: { width: '100%', marginTop: '10px', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { background: '#1e293b', width: '80%', padding: '20px', borderRadius: '15px' },
  listP: { padding: '12px', borderBottom: '1px solid #334155', textAlign: 'center' },
  closeBtn: { width: '100%', marginTop: '10px', padding: '10px', background: '#ef4444', border: 'none', color: 'white' },
  form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white' },
  area: { padding: '12px', background: '#1e293b', color: 'white', height: '80px' },
  createBtn: { background: '#eab308', color: 'black', fontWeight: 'bold', padding: '15px', border: 'none' }
};
