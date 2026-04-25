import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_NAME = "Touqeer Iqbal Baghoor";
const ADMIN_WA = "00923015800630";
const ADMIN_PASS = "1122";

export default function AdhiKotUltimateCricket() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'history' | 'setup'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState("");
  const [adminPic, setAdminPic] = useState<string>("");
  const [ani, setAni] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'matchHistory'), (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], dbKey: key }));
        setHistory(list);
      } else { setHistory([]); }
    });
    setAdminPic(localStorage.getItem("admin_dp") || "");
  }, []);

  const handlePic = (e: any) => {
    const reader = new FileReader();
    reader.onload = () => { setAdminPic(reader.result as string); localStorage.setItem("admin_dp", reader.result as string); };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleCreate = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const createPlayers = (str: string) => str.split(",").map(n => ({ 
      name: n.trim(), runs: 0, balls: 0, wa: "923" + Math.floor(Math.random()*10000000) 
    }));

    const mData = {
      league: fd.get("lg"), ground: fd.get("gd"), umpire: fd.get("um"),
      toss: `${fd.get("tw")} won & elected to ${fd.get("dec")}`,
      teamA: { name: fd.get("tA"), players: createPlayers(fd.get("pA") as string) },
      teamB: { name: fd.get("tB"), players: createPlayers(fd.get("pB") as string) },
      score: 0, wkts: 0, balls: 0, ovs: 0, target: 0,
      striker: null, nonStriker: null, bowler: null, status: "Live"
    };
    set(ref(db, 'liveMatch'), mData);
    setView('live');
  };

  const updateScore = (r: number, t = "n") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    if (t === "W") { m.wkts += 1; m.balls += 1; setAni("OUT! ☝️"); m.striker = null; }
    else if (t === "WD" || t === "NB") { m.score += (r + 1); setAni(t); }
    else {
      m.score += r; m.balls += 1; m.striker.runs += r; m.striker.balls += 1;
      if (r === 4) setAni("FOUR! 🏏"); if (r === 6) setAni("SIX! 🚀");
      if (r % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    if (m.balls >= 6) { m.ovs += 1; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
    setTimeout(() => setAni(""), 2000);
  };

  const calcRR = () => {
    const totalBalls = (match.ovs * 6) + match.balls;
    return totalBalls > 0 ? ((match.score / totalBalls) * 6).toFixed(2) : "0.00";
  };

  return (
    <div style={s.body}>
      {/* HEADER */}
      <div style={s.top}>
        <div style={s.adminRow}>
          <label><img src={adminPic || "https://via.placeholder.com/50"} style={s.dp}/><input type="file" hidden onChange={handlePic}/></label>
          <div>
            <div style={s.aName}>{ADMIN_NAME}</div>
            <a href={`https://wa.me/${ADMIN_WA}`} style={s.waLink}>🟢 Admin WhatsApp</a>
          </div>
        </div>
        <div style={s.nav}>
          <button onClick={() => setView('live')} style={s.nBtn}>Live</button>
          <button onClick={() => setView('history')} style={s.nBtn}>History</button>
          {isAdmin ? <button onClick={() => setView('setup')} style={s.addB}>+ Match</button> : 
          <input placeholder="Pass" type="password" style={s.ps} onChange={e => e.target.value === ADMIN_PASS && setIsAdmin(true)}/>}
        </div>
      </div>

      {/* SETUP */}
      {view === 'setup' && isAdmin && (
        <form onSubmit={handleCreate} style={s.form}>
          <input name="lg" placeholder="League Name" style={s.in} required />
          <input name="um" placeholder="Umpire Name" style={s.in} required />
          <input name="gd" placeholder="Ground" style={s.in} required />
          <div style={s.flex}><input name="tw" placeholder="Toss Winner" style={s.in}/><input name="dec" placeholder="Bat/Bowl" style={s.in}/></div>
          <input name="tA" placeholder="Batting Team" style={s.in} required />
          <textarea name="pA" placeholder="Batsmen Names (Comma separated)" style={s.ar} required />
          <input name="tB" placeholder="Bowling Team" style={s.in} required />
          <textarea name="pB" placeholder="Bowlers Names (Comma separated)" style={s.ar} required />
          <button type="submit" style={s.mBtn}>START MATCH</button>
        </form>
      )}

      {/* LIVE */}
      {view === 'live' && match && (
        <div style={s.lCard}>
          <div style={s.liveTag}><span>●</span> LIVE</div>
          <div style={s.meta}>{match.league} | {match.ground} <br/> Umpire: {match.umpire}</div>
          <div style={s.score}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
          <div style={s.rr}>Run Rate: {calcRR()} | {match.toss}</div>

          <div style={s.stBox}>
            {['striker', 'nonStriker'].map(key => (
              <div key={key} style={s.stRow}>
                {match[key] ? `🏏 ${match[key].name}* ${match[key].runs}(${match[key].balls})` : 
                isAdmin ? <select onChange={e => {
                  let m = {...match}; m[key] = match.teamA.players[e.target.selectedIndex-1]; set(ref(db, 'liveMatch'), m);
                }} style={s.sel}><option>Select {key}</option>{match.teamA.players.map((p:any,i:number)=><option key={i}>{p.name}</option>)}</select> : `Waiting for ${key}...`}
                {match[key] && <a href={`https://wa.me/${match[key].wa}`} style={s.pWa}>📞</a>}
              </div>
            ))}
            <div style={s.stRowBowl}>
              {match.bowler ? `⚪ Bowler: ${match.bowler.name}` : 
              isAdmin ? <select onChange={e => {
                let m = {...match}; m.bowler = match.teamB.players[e.target.selectedIndex-1]; set(ref(db, 'liveMatch'), m);
              }} style={s.sel}><option>Select Bowler</option>{match.teamB.players.map((p:any,i:number)=><option key={i}>{p.name}</option>)}</select> : "Selecting Bowler..."}
            </div>
          </div>

          {isAdmin && (
            <div style={s.ctrl}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={s.scB}>{n}</button>)}
              <button onClick={()=>updateScore(0,"WD")} style={s.exB}>WD</button>
              <button onClick={()=>updateScore(0,"NB")} style={s.exB}>NB</button>
              <button onClick={()=>updateScore(0,"W")} style={s.wB}>WICKET</button>
              <button onClick={() => { push(ref(db, 'matchHistory'), match); remove(ref(db, 'liveMatch')); }} style={s.enB}>END & SAVE</button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div style={{padding:'15px'}}>
          {history.reverse().map((h, i) => (
            <div key={i} style={s.hCard}>
              <div style={s.flex}>
                <div><b>{h.teamA.name} vs {h.teamB.name}</b><br/><small>{h.league}</small></div>
                {isAdmin && <button onClick={()=>remove(ref(db, `matchHistory/${h.dbKey}`))} style={s.del}>Del</button>}
              </div>
              <div style={{color:'#f5cd11', marginTop:'5px'}}>Final Score: {h.score}/{h.wkts} ({h.ovs} ovs)</div>
            </div>
          ))}
        </div>
      )}

      {ani && <div style={s.aniBox}>{ani}</div>}
    </div>
  );
}

const s: any = {
  body: { background: '#0a0f1e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  top: { background: '#161d31', padding: '10px', borderBottom: '2px solid #f5cd11', position: 'sticky', top: 0, zIndex: 10 },
  adminRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  dp: { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' },
  aName: { fontSize: '13px', fontWeight: 'bold', color: '#f5cd11' },
  waLink: { fontSize: '10px', color: '#25D366', textDecoration: 'none' },
  nav: { display: 'flex', gap: '5px' },
  nBtn: { background: '#334155', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' },
  addB: { background: '#f5cd11', color: 'black', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' },
  ps: { width: '50px', background: 'none', border: '1px solid #334155', color: 'white', padding: '2px' },
  form: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
  in: { padding: '10px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '5px' },
  ar: { padding: '10px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '5px', height: '50px' },
  mBtn: { background: '#f5cd11', color: 'black', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  lCard: { margin: '15px', padding: '20px', background: '#161d31', borderRadius: '20px', border: '1px solid #334155' },
  liveTag: { color: '#ef4444', fontSize: '12px', fontWeight: 'bold', animation: 'blink 1s infinite' },
  meta: { textAlign: 'center', fontSize: '11px', color: '#94a3b8' },
  score: { fontSize: '55px', textAlign: 'center', fontWeight: 'bold', margin: '10px 0' },
  rr: { textAlign: 'center', fontSize: '12px', color: '#f5cd11' },
  stBox: { marginTop: '15px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' },
  stRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', alignItems: 'center' },
  stRowBowl: { padding: '8px 0', color: '#f5cd11' },
  sel: { background: '#0a0f1e', color: 'white', border: '1px solid #f5cd11', fontSize: '11px' },
  pWa: { textDecoration: 'none', background: '#25D366', borderRadius: '50%', padding: '2px 5px', fontSize: '10px' },
  ctrl: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '15px' },
  scB: { padding: '12px', background: 'white', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  exB: { background: '#f5cd11', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  wB: { gridColumn: 'span 2', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px' },
  enB: { gridColumn: 'span 4', background: '#334155', color: '#94a3b8', border: 'none', padding: '8px', borderRadius: '5px' },
  hCard: { background: '#161d31', padding: '12px', borderRadius: '10px', marginBottom: '8px', borderLeft: '4px solid #f5cd11' },
  del: { background: '#ef4444', color: 'white', border: 'none', fontSize: '10px', borderRadius: '3px' },
  flex: { display: 'flex', justifyContent: 'space-between', gap: '5px' },
  aniBox: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', color: '#f5cd11', zIndex: 100 }
};
