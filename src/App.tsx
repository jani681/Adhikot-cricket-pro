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
const ADMIN_PASS = "1122"; // Aapka Password

export default function AdhiKotProFinal() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'history' | 'setup'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState("");
  const [adminPic, setAdminPic] = useState<string>("");
  const [animation, setAnimation] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'matchHistory'), (snap) => {
      const data = snap.val();
      if (data) setHistory(Object.values(data));
    });
    const savedPic = localStorage.getItem("admin_dp");
    if (savedPic) setAdminPic(savedPic);
  }, []);

  const handlePicUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAdminPic(base64);
      localStorage.setItem("admin_dp", base64);
    };
    reader.readAsDataURL(file);
  };

  const checkAdmin = () => {
    if (passInp === ADMIN_PASS) { setIsAdmin(true); setPassInp(""); }
    else { alert("Wrong Password!"); }
  };

  const handleCreate = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const pB = (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    const mData = {
      league: fd.get("league"),
      ground: fd.get("ground"),
      info: `${fd.get("date")} | ${fd.get("time")}`,
      oversTotal: parseInt(fd.get("ovs") as string),
      teamA: { name: fd.get("tA"), players: pA },
      teamB: { name: fd.get("tB"), players: pB },
      score: 0, wickets: 0, balls: 0, overs: 0,
      striker: { name: pA[0].name, idx: 0, runs: 0, balls: 0 },
      nonStriker: { name: pA[1].name, idx: 1, runs: 0, balls: 0 },
      bowler: { name: pB[0].name, runs: 0, wkts: 0, balls: 0 },
      status: "Live"
    };
    set(ref(db, 'liveMatch'), mData);
    setView('live');
  };

  const updateScore = (r: number, t = "n") => {
    if (!match || !isAdmin) return;
    let m = { ...match };
    if (t === "W") { m.wickets += 1; m.balls += 1; setAnimation("OUT! ☝️"); }
    else if (t === "WD" || t === "NB") { m.score += (r + 1); setAnimation(t === "NB" ? "FREE HIT! 🆓" : "WIDE! ⚪"); }
    else {
      m.score += r; m.balls += 1; m.striker.runs += r; m.striker.balls += 1;
      if (r === 4) setAnimation("FOUR! 🏏");
      if (r === 6) setAnimation("SIXER! 🚀");
      if (r % 2 !== 0) { let temp = m.striker; m.striker = m.nonStriker; m.nonStriker = temp; }
    }
    if (m.balls >= 6) { m.overs += 1; m.balls = 0; let temp = m.striker; m.striker = m.nonStriker; m.nonStriker = temp; }
    set(ref(db, 'liveMatch'), m);
    setTimeout(() => setAnimation(""), 2000);
  };

  return (
    <div style={s.body}>
      {/* PERMANENT ADMIN HEADER */}
      <div style={s.topBar}>
        <div style={s.adminFlex}>
          <label style={s.dpLabel}>
            <img src={adminPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={s.dp}/>
            <input type="file" hidden onChange={handlePicUpload} />
          </label>
          <div>
            <div style={s.adminName}>{ADMIN_NAME}</div>
            <a href={`https://wa.me/${ADMIN_WA}`} style={s.waLink}>🟢 WhatsApp Admin</a>
          </div>
        </div>
        <div style={s.nav}>
          <button onClick={() => setView('live')} style={s.navBtn}>Live</button>
          <button onClick={() => setView('history')} style={s.navBtn}>History</button>
          {!isAdmin && <input placeholder="Pass" type="password" style={s.passInp} onChange={e=>setPassInp(e.target.value)} onBlur={checkAdmin}/>}
          {isAdmin && <button onClick={() => setView('setup')} style={s.addBtn}>+ Match</button>}
        </div>
      </div>

      {view === 'setup' && isAdmin && (
        <form onSubmit={handleCreate} style={s.form}>
          <input name="league" placeholder="League Name" style={s.inp} required />
          <input name="ground" placeholder="Ground Name" style={s.inp} required />
          <div style={{display:'flex', gap:'5px'}}><input name="date" type="date" style={s.inp}/><input name="time" type="time" style={s.inp}/></div>
          <input name="ovs" placeholder="Total Overs" type="number" style={s.inp} required />
          <input name="tA" placeholder="Batting Team" style={s.inp} required />
          <textarea name="pA" placeholder="Batsmen (Ali, Ahmed...)" style={s.area} required />
          <input name="tB" placeholder="Bowling Team" style={s.inp} required />
          <textarea name="pB" placeholder="Bowlers (Zaid, Khan...)" style={s.area} required />
          <button type="submit" style={s.mainBtn}>START LIVE MATCH</button>
        </form>
      )}

      {view === 'live' && match && (
        <div style={s.liveCard}>
          <div style={s.matchMeta}>{match.league} | {match.ground} <br/> {match.info}</div>
          <div style={s.scoreBig}>{match.score}/{match.wickets} <small style={{fontSize:'20px'}}>({match.overs}.{match.balls})</small></div>
          <div style={s.statsBox}>
            <div style={s.statRow}>🏏 {match.striker.name}* <span>{match.striker.runs}({match.striker.balls})</span></div>
            <div style={s.statRow}>🏏 {match.nonStriker.name} <span>{match.nonStriker.runs}({match.nonStriker.balls})</span></div>
            <div style={s.statRowBowl}>⚪ Bowler: {match.bowler.name}</div>
          </div>
          {isAdmin && (
            <div style={s.adminControls}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={s.scBtn}>{n}</button>)}
              <button onClick={()=>updateScore(0,"WD")} style={s.exBtn}>WD</button>
              <button onClick={()=>updateScore(0,"NB")} style={s.exBtn}>NB</button>
              <button onClick={()=>updateScore(0,"W")} style={s.wktBtn}>WICKET</button>
              <button onClick={() => { push(ref(db, 'matchHistory'), match); remove(ref(db, 'liveMatch')); }} style={s.endBtn}>END & SAVE RECORD</button>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div style={{padding:'15px'}}>
          <h2 style={{color:'#f5cd11', fontSize:'18px'}}>Match Archives</h2>
          {history.reverse().map((h, i) => (
            <div key={i} style={s.histCard}>
              <div style={{fontWeight:'bold'}}>{h.teamA.name} vs {h.teamB.name}</div>
              <div style={{fontSize:'12px', color:'#94a3b8'}}>{h.league} | {h.info}</div>
              <div style={{color:'#f5cd11', marginTop:'5px'}}>Final: {h.score}/{h.wickets} ({h.overs} ovs)</div>
            </div>
          ))}
        </div>
      )}

      {animation && <div style={s.ani}>{animation}</div>}
    </div>
  );
}

const s: any = {
  body: { background: '#0a0f1e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  topBar: { background: '#161d31', padding: '10px', borderBottom: '2px solid #f5cd11', position: 'sticky', top: 0, zIndex: 10 },
  adminFlex: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
  dpLabel: { cursor: 'pointer' },
  dp: { width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' },
  adminName: { fontSize: '14px', fontWeight: 'bold', color: '#f5cd11' },
  waLink: { fontSize: '11px', color: '#25D366', textDecoration: 'none' },
  nav: { display: 'flex', gap: '8px' },
  navBtn: { background: '#334155', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px' },
  addBtn: { background: '#f5cd11', color: 'black', border: 'none', padding: '6px 12px', borderRadius: '5px', fontWeight: 'bold' },
  passInp: { width: '60px', background: '#0f172a', border: '1px solid #334155', color: 'white', fontSize: '10px', padding: '5px', borderRadius: '4px' },
  form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  inp: { padding: '12px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '8px' },
  area: { padding: '12px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '8px', height: '60px' },
  mainBtn: { background: '#f5cd11', color: 'black', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  liveCard: { margin: '15px', padding: '20px', background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: '25px', border: '1px solid #334155' },
  matchMeta: { textAlign: 'center', fontSize: '11px', color: '#94a3b8' },
  scoreBig: { fontSize: '65px', textAlign: 'center', fontWeight: 'bold', margin: '10px 0' },
  statsBox: { background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #334155' },
  statRowBowl: { padding: '8px 0', color: '#f5cd11', fontSize: '13px' },
  adminControls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '15px' },
  scBtn: { padding: '12px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  exBtn: { background: '#f5cd11', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 2', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  endBtn: { gridColumn: 'span 4', background: '#334155', color: '#94a3b8', padding: '10px', border: 'none', borderRadius: '8px', marginTop: '10px' },
  histCard: { background: '#161d31', padding: '15px', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #f5cd11' },
  ani: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', color: '#f5cd11', fontWeight: 'bold', zIndex: 100 }
};
