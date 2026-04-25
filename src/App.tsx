import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_NAME = "Touqeer Iqbal Baghoor";
const ADMIN_WA = "923015800630";
const ADMIN_PASS = "1122";

export default function AdhiKotCricketUltimate() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'history' | 'setup'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [ani, setAni] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'matchHistory'), (snap) => {
      const data = snap.val();
      setHistory(data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : []);
    });
  }, []);

  const handleCreate = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parsePlayers = (str: string) => str.split(",").map(p => {
      const [name, wa] = p.split("-");
      return { name: name?.trim(), wa: wa?.trim() || ADMIN_WA, r: 0, b: 0, f: 0, s: 0, d: 0 };
    });

    const mData = {
      league: fd.get("lg"), ground: fd.get("gd"), umpire: fd.get("um"),
      date: fd.get("dt"), time: fd.get("tm"), toss: `${fd.get("tw")} won & elected to ${fd.get("dec")}`,
      teamA: { name: fd.get("tA"), logo: fd.get("lA"), players: parsePlayers(fd.get("pA") as string) },
      teamB: { name: fd.get("tB"), logo: fd.get("lB"), players: parsePlayers(fd.get("pB") as string) },
      score: 0, wkts: 0, balls: 0, ovs: 0, target: 0, inning: 1,
      striker: null, nonStriker: null, bowler: null, status: "Live"
    };
    set(ref(db, 'liveMatch'), mData);
    setView('live');
  };

  const updateScore = (r: number, type = "n") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    let s = m.striker;

    if (type === "W") {
      m.wkts += 1; m.balls += 1; s.b += 1; s.d += 1;
      setAni("OUT! ☝️"); m.striker = null;
    } else if (type === "WD" || type === "NB") {
      m.score += (r + 1); setAni(type);
    } else {
      m.score += r; m.balls += 1; s.r += r; s.b += 1;
      if (r === 0) s.d += 1; if (r === 4) s.f += 1; if (r === 6) s.s += 1;
      if (r === 4) setAni("FOUR! 🏏"); if (r === 6) setAni("SIX! 🚀");
      if (r % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if (m.balls >= 6) { m.ovs += 1; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
    setTimeout(() => setAni(""), 1500);
  };

  const endInning = () => {
    let m = { ...match };
    if (m.inning === 1) {
      m.target = m.score + 1; m.inning = 2; m.score = 0; m.wkts = 0; m.ovs = 0; m.balls = 0;
      m.striker = null; m.nonStriker = null; m.bowler = null;
      [m.teamA, m.teamB] = [m.teamB, m.teamA]; // Swap teams for 2nd inning
      set(ref(db, 'liveMatch'), m);
    } else {
      push(ref(db, 'matchHistory'), m);
      remove(ref(db, 'liveMatch'));
    }
  };

  return (
    <div style={s.body}>
      {/* ADMIN TOP BAR */}
      <div style={s.header}>
        <div style={s.adminInfo}>
          <img src="https://i.ibb.co/Vpgm8S1/touqeer.jpg" style={s.adminDp} alt="Admin"/>
          <div><div style={s.adminName}>{ADMIN_NAME}</div><a href={`https://wa.me/${ADMIN_WA}`} style={s.waBtn}>🟢 WhatsApp Admin</a></div>
        </div>
        <div style={s.nav}>
          <button onClick={() => setView('live')} style={s.navB}>Live</button>
          <button onClick={() => setView('history')} style={s.navB}>History</button>
          {isAdmin ? <button onClick={() => setView('setup')} style={s.setupB}>+ New Match</button> : 
          <input placeholder="Code" type="password" style={s.pass} onChange={e => e.target.value === ADMIN_PASS && setIsAdmin(true)}/>}
        </div>
      </div>

      {/* SETUP FORM */}
      {view === 'setup' && isAdmin && (
        <form onSubmit={handleCreate} style={s.form}>
          <input name="lg" placeholder="League Name" style={s.inp} required />
          <div style={s.row}><input name="dt" type="date" style={s.inp}/><input name="tm" type="time" style={s.inp}/></div>
          <input name="um" placeholder="Umpire Name" style={s.inp}/>
          <input name="gd" placeholder="Ground Name" style={s.inp}/>
          <div style={s.row}><input name="tw" placeholder="Toss Winner" style={s.inp}/><input name="dec" placeholder="Bat/Bowl" style={s.inp}/></div>
          
          <div style={s.teamEntry}>
            <input name="tA" placeholder="Team A Name" style={s.inp}/>
            <input name="lA" placeholder="Team A Logo URL" style={s.inp}/>
            <textarea name="pA" placeholder="Player-WhatsApp, Player-WhatsApp..." style={s.area}/>
          </div>
          <div style={s.teamEntry}>
            <input name="tB" placeholder="Team B Name" style={s.inp}/>
            <input name="lB" placeholder="Team B Logo URL" style={s.inp}/>
            <textarea name="pB" placeholder="Player-WhatsApp, Player-WhatsApp..." style={s.area}/>
          </div>
          <button type="submit" style={s.submitB}>START LIVE BROADCAST</button>
        </form>
      )}

      {/* LIVE SCORECARD */}
      {view === 'live' && match && (
        <div style={s.card}>
          <div style={s.liveBadge}><span>●</span> LIVE</div>
          <div style={s.meta}>{match.league} | {match.ground}<br/>Umpire: {match.umpire}</div>
          
          <div style={s.mainScoreRow}>
            <img src={match.teamA.logo || "https://cdn-icons-png.flaticon.com/512/806/806542.png"} style={s.tLogo}/>
            <div style={s.scoreText}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
            <img src={match.teamB.logo || "https://cdn-icons-png.flaticon.com/512/806/806542.png"} style={s.tLogo}/>
          </div>

          <div style={s.infoBar}>
            {match.target > 0 ? `Target: ${match.target} | Needs ${match.target - match.score} in ${(6 - match.balls) + (5 - match.ovs)*6} balls` : match.toss}
          </div>

          {/* PLAYER STATS TABLE */}
          <div style={s.statsTable}>
            <div style={s.tableH}><span>Batsman</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>0s</span><span>WA</span></div>
            {['striker', 'nonStriker'].map(k => (
              <div key={k} style={s.tableR}>
                {match[k] ? (
                  <>
                    <span style={{flex:2}}>{match[k].name}{k === 'striker' ? '*' : ''}</span>
                    <span>{match[k].r}</span><span>{match[k].b}</span><span>{match[k].f}</span><span>{match[k].s}</span><span>{match[k].d}</span>
                    <a href={`https://wa.me/${match[k].wa}`} style={s.waLink}>📞</a>
                  </>
                ) : isAdmin ? (
                  <select style={s.select} onChange={e => {
                    let m={...match}; m[k]=match.teamA.players[e.target.selectedIndex-1]; set(ref(db, 'liveMatch'), m);
                  }}>
                    <option>Select {k}</option>
                    {match.teamA.players.map((p:any,i:number)=><option key={i}>{p.name}</option>)}
                  </select>
                ) : <span>Waiting...</span>}
              </div>
            ))}
          </div>

          {isAdmin && (
            <div style={s.adminPanel}>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={s.btn}>{n}</button>)}
                <button onClick={()=>updateScore(0,"WD")} style={s.exBtn}>WD</button>
                <button onClick={()=>updateScore(0,"NB")} style={s.exBtn}>NB</button>
              </div>
              <button onClick={()=>updateScore(0,"W")} style={s.wktBtn}>WICKET OUT</button>
              <button onClick={endInning} style={s.endBtn}>{match.inning === 1 ? "END 1ST INNING" : "MATCH FINISHED & SAVE"}</button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div style={{padding:'10px'}}>
          {history.reverse().map((h, i) => (
            <div key={i} style={s.hCard}>
              <div style={s.row}><b>{h.teamA.name} vs {h.teamB.name}</b> {isAdmin && <button onClick={()=>remove(ref(db, `matchHistory/${h.id}`))} style={s.del}>Del</button>}</div>
              <div style={{color:'#f5cd11', fontSize:'14px'}}>Result: {h.score}/{h.wkts} ({h.ovs} Overs)</div>
              <div style={{fontSize:'10px', color:'#94a3b8'}}>{h.league} | {h.date}</div>
            </div>
          ))}
        </div>
      )}

      {ani && <div style={s.overlay}>{ani}</div>}
    </div>
  );
}

const s: any = {
  body: { background: '#0a0f1e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#161d31', padding: '10px', borderBottom: '2px solid #f5cd11', sticky: 'top' },
  adminInfo: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' },
  adminDp: { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #f5cd11' },
  adminName: { fontSize: '13px', fontWeight: 'bold' },
  waBtn: { fontSize: '10px', color: '#25D366', textDecoration: 'none' },
  nav: { display: 'flex', gap: '5px' },
  navB: { background: '#334155', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px' },
  setupB: { background: '#f5cd11', color: 'black', border: 'none', padding: '5px 12px', borderRadius: '4px', fontWeight: 'bold' },
  pass: { width: '50px', background: 'none', border: '1px solid #334155', color: 'white' },
  form: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
  inp: { padding: '10px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '5px' },
  area: { padding: '10px', background: '#161d31', color: 'white', height: '60px' },
  row: { display: 'flex', gap: '5px' },
  submitB: { background: '#f5cd11', color: 'black', padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '5px' },
  card: { margin: '15px', padding: '20px', background: '#161d31', borderRadius: '25px', border: '1px solid #334155' },
  liveBadge: { color: '#ef4444', fontWeight: 'bold', fontSize: '12px' },
  meta: { textAlign: 'center', fontSize: '11px', color: '#94a3b8' },
  mainScoreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' },
  tLogo: { width: '50px', height: '50px', objectFit: 'contain' },
  scoreText: { fontSize: '45px', fontWeight: 'bold' },
  infoBar: { textAlign: 'center', color: '#f5cd11', fontSize: '13px', marginBottom: '15px' },
  statsTable: { background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px' },
  tableH: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '5px' },
  tableR: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid #222' },
  select: { background: '#0a0f1e', color: 'white', fontSize: '10px', border: '1px solid #f5cd11' },
  waLink: { textDecoration: 'none', background: '#25D366', borderRadius: '50%', padding: '2px 5px', fontSize: '10px' },
  adminPanel: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' },
  btn: { padding: '12px', background: 'white', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '5px' },
  exBtn: { background: '#f5cd11', fontWeight: 'bold', border: 'none' },
  wktBtn: { background: '#ef4444', color: 'white', padding: '10px', border: 'none', borderRadius: '5px' },
  endBtn: { background: '#334155', color: '#94a3b8', padding: '8px', border: 'none' },
  hCard: { background: '#161d31', padding: '12px', marginBottom: '8px', borderLeft: '4px solid #f5cd11' },
  del: { background: '#ef4444', border: 'none', color: 'white', fontSize: '10px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', color: '#f5cd11', zIndex: 100 }
};
