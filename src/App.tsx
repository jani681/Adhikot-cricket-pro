import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_WA = "923015800630";
const ADMIN_PASS = "6545";

export default function AdhiKotProApp() {
  const [match, setMatch] = useState<any>(null);
  const [view, setView] = useState<'live' | 'history' | 'setup' | 'login'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState('');
  const [adminDp, setAdminDp] = useState<string>("");

  useEffect(() => {
    const savedDp = localStorage.getItem('admin_dp');
    if (savedDp) setAdminDp(savedDp);
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleDpUpload = (e: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAdminDp(b64);
      localStorage.setItem('admin_dp', b64);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parse = (str: string) => str.split(",").map(s => ({ name: s.trim(), r: 0, b: 0, f4: 0, s6: 0 }));

    const newMatch = {
      league: fd.get('league'),
      umpire: fd.get('umpire'),
      ground: fd.get('ground'),
      toss: fd.get('toss'),
      choice: fd.get('choice'),
      batTeam: fd.get('batTeam'),
      bowTeam: fd.get('bowTeam'),
      pBat: parse(fd.get('pBat') as string),
      pBow: parse(fd.get('pBow') as string),
      score: 0, wkts: 0, balls: 0, ovs: 0, inning: 1,
      striker: null, nonStriker: null, bowler: null
    };
    set(ref(db, 'liveMatch'), newMatch);
    setView('live');
  };

  const updateScore = (runs: number, extra = "") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    if (extra === "W") {
      m.wkts += 1; m.balls += 1; m.striker.b += 1; m.striker = null;
    } else if (extra === "WD" || extra === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs; m.balls += 1; m.striker.r += runs; m.striker.b += 1;
      if (runs === 4) m.striker.f4 += 1;
      if (runs === 6) m.striker.s6 += 1;
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    if (m.balls === 6) { m.ovs += 1; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
  };

  return (
    <div style={s.body}>
      {/* HEADER SECTION - SAME AS SS */}
      <div style={s.header}>
        <div style={s.adminInfo}>
          <div style={s.dpWrap}>
            <img src={adminDp || "https://via.placeholder.com/100"} style={s.dp} alt="Admin" />
            {isAdmin && <input type="file" style={s.fileInp} onChange={handleDpUpload} />}
          </div>
          <div>
            <div style={s.adminName}>Touqeer Iqbal Baghoor</div>
            <a href={`https://wa.me/${ADMIN_WA}`} style={s.waLink}>🟢 WhatsApp Admin</a>
          </div>
        </div>
        <div style={s.nav}>
          <button onClick={() => setView('live')} style={view === 'live' ? s.tabActive : s.tab}>Live</button>
          <button onClick={() => setView('history')} style={view === 'history' ? s.tabActive : s.tab}>History</button>
          <button onClick={() => isAdmin ? setView('setup') : setView('login')} style={s.addMatchBtn}>+ Match</button>
        </div>
      </div>

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div style={s.container}>
          <input type="password" placeholder="Admin Password" style={s.input} onChange={e => setPassInp(e.target.value)} />
          <button onClick={() => passInp === ADMIN_PASS ? (setIsAdmin(true), setView('setup')) : alert("Ghalat Password!")} style={s.mainBtn}>LOGIN</button>
        </div>
      )}

      {/* SETUP VIEW - ALL FIELDS FROM SS */}
      {view === 'setup' && isAdmin && (
        <form onSubmit={startMatch} style={s.container}>
          <h2 style={s.title}>ADHI KOT PRO SETUP</h2>
          <input name="league" placeholder="League Name" style={s.input} required />
          <input name="umpire" placeholder="Umpire Name" style={s.input} required />
          <input name="ground" placeholder="Ground Name" style={s.input} required />
          <div style={s.row}>
            <input name="toss" placeholder="Toss Winner" style={{ ...s.input, flex: 2 }} />
            <select name="choice" style={{ ...s.input, flex: 1 }}><option>Bat</option><option>Bowl</option></select>
          </div>
          <input name="batTeam" placeholder="Batting Team" style={s.input} required />
          <textarea name="pBat" placeholder="Batsmen Names (Ali, Ahmed...)" style={s.area} required />
          <input name="bowTeam" placeholder="Bowling Team" style={s.input} required />
          <textarea name="pBow" placeholder="Bowlers Names (Zaid, Khan...)" style={s.area} required />
          <button type="submit" style={s.mainBtn}>START MATCH</button>
        </form>
      )}

      {/* LIVE VIEW */}
      {view === 'live' && match && (
        <div style={s.scoreBox}>
          <div style={s.matchMeta}>{match.league} | {match.ground}<br/>Umpire: {match.umpire}</div>
          <div style={s.bigScore}>{match.score}/{match.wkts} <span style={{ fontSize: '24px' }}>({match.ovs}.{match.balls})</span></div>
          <div style={s.statusText}>{match.toss} won & elected to {match.choice}</div>

          {/* PLAYERS LIST */}
          <div style={s.playerTable}>
            {[match.striker, match.nonStriker].map((p, i) => (
              <div key={i} style={s.pRow} onClick={() => isAdmin && set(ref(db, 'liveMatch'), { ...match, [i === 0 ? 'striker' : 'nonStriker']: match.pBat[0] })}>
                <span>{p ? `${p.name}${i === 0 ? '*' : ''}` : `Select ${i === 0 ? 'Striker' : 'Non-Striker'}`}</span>
                <span>{p ? `${p.r}(${p.b})` : "0(0)"} <a href={`https://wa.me/${ADMIN_WA}`} style={s.waSmall}>📞</a></span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div style={s.controls}>
              <div style={s.grid}>
                {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => updateScore(n)} style={s.numBtn}>{n}</button>)}
                <button onClick={() => updateScore(0, "WD")} style={s.exBtn}>WD</button>
                <button onClick={() => updateScore(0, "NB")} style={s.exBtn}>NB</button>
              </div>
              <button onClick={() => updateScore(0, "W")} style={s.wktBtn}>WICKET OUT</button>
              <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.resetBtn}>RESET MATCH</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s: any = {
  body: { background: '#0a101e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#161d31', padding: '15px', borderBottom: '1px solid #f5cd11' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
  dpWrap: { position: 'relative', width: '60px', height: '60px' },
  dp: { width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' },
  fileInp: { position: 'absolute', inset: 0, opacity: 0 },
  adminName: { fontWeight: 'bold', color: '#f5cd11', fontSize: '16px' },
  waLink: { color: '#22c55e', fontSize: '12px', textDecoration: 'none' },
  nav: { display: 'flex', gap: '10px' },
  tab: { background: '#252d4a', color: '#ccc', border: 'none', padding: '8px 15px', borderRadius: '5px' },
  tabActive: { background: '#f5cd11', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  addMatchBtn: { marginLeft: 'auto', background: '#f5cd11', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  container: { padding: '20px' },
  title: { textAlign: 'center', color: '#f5cd11', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#161d31', border: '1px solid #334155', color: 'white', borderRadius: '8px' },
  area: { width: '100%', padding: '12px', background: '#161d31', border: '1px solid #334155', color: 'white', height: '80px', borderRadius: '8px', marginBottom: '10px' },
  mainBtn: { width: '100%', padding: '15px', background: '#f5cd11', border: 'none', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' },
  scoreBox: { padding: '20px' },
  matchMeta: { textAlign: 'center', color: '#aaa', fontSize: '14px' },
  bigScore: { fontSize: '60px', textAlign: 'center', margin: '20px 0', fontWeight: 'bold' },
  statusText: { textAlign: 'center', color: '#f5cd11', marginBottom: '20px' },
  pRow: { background: '#161d31', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  waSmall: { textDecoration: 'none', marginLeft: '10px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  numBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  exBtn: { background: '#f5cd11', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { width: '100%', padding: '15px', background: '#ef4444', border: 'none', marginTop: '10px', borderRadius: '8px', fontWeight: 'bold', color: 'white' },
  resetBtn: { width: '100%', background: 'none', border: 'none', color: '#555', marginTop: '20px' },
  row: { display: 'flex', gap: '10px' }
};
