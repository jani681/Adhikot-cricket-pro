import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove, update } from "firebase/database";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const ADMIN_PASS = "6545";

export default function AdhikotCloudPro() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'setup' | 'login' | 'history'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [anim, setAnim] = useState("");
  const [passInp, setPassInp] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- REAL-TIME SYNC ENGINE ---
  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const historyRef = ref(db, 'history');

    // Sync Match Data
    const unsubMatch = onValue(matchRef, (snap) => {
      const data = snap.val();
      setMatch(data || null);
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase Error:", err);
      setIsLoading(false);
    });

    // Sync History
    const unsubHist = onValue(historyRef, (snap) => {
      const data = snap.val();
      setHistory(data ? Object.entries(data).map(([id, val]: any) => ({ ...val, id })) : []);
    });

    return () => { unsubMatch(); unsubHist(); };
  }, []);

  const triggerAnim = (txt: string) => {
    setAnim(txt);
    setTimeout(() => setAnim(""), 2500);
  };

  const handleAction = (runs: number, type: string = "reg") => {
    if (!match || !isAdmin) return;
    
    // Defensive Copy
    let m = JSON.parse(JSON.stringify(match));
    
    if (type === "W") {
      m.wkts = (m.wkts || 0) + 1; m.balls = (m.balls || 0) + 1;
      triggerAnim("OUT! ☝️");
      m.striker = null; 
    } else if (type === "WD") {
      m.score = (m.score || 0) + (runs + 1);
      triggerAnim("WIDE! ↔️");
    } else if (type === "NB") {
      m.score = (m.score || 0) + (runs + 1);
      m.freeHit = true;
      triggerAnim("NO-BALL! ⚠️");
    } else {
      m.score = (m.score || 0) + runs;
      m.balls = (m.balls || 0) + 1;
      m.freeHit = false;
      if (runs === 4) triggerAnim("FOUR! 🏏");
      if (runs === 6) triggerAnim("SIX! 🚀");

      // Update Individual Stats
      if (m.striker) {
        m.striker.r = (m.striker.r || 0) + runs;
        m.striker.b = (m.striker.b || 0) + 1;
      }
      // Strike Rotation
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    // Over Change
    if (m.balls >= 6) {
      m.ovs = (m.ovs || 0) + 1; m.balls = 0;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      m.bowler = null; // Forces admin to select new bowler
    }

    set(ref(db, 'liveMatch'), m);
  };

  const sendWhatsApp = (p: any) => {
    if (!match) return;
    const text = `🏏 *ADHI KOT LIVE*\n🏆 ${match.league}\n📊 Score: ${match.score}/${match.wkts} (${match.ovs}.${match.balls})\n👤 Umpire: ${match.umpire}\n🎯 Target: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/${p.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <div style={s.loader}>Adhikot Pro: Authenticating with Database...</div>;

  return (
    <div style={s.app}>
      {/* Dynamic Header */}
      <div style={s.nav}>
        <div style={s.profile}>
          <div style={s.avatar}>T</div>
          <div>
            <div style={s.uName}>Touqeer Iqbal Baghoor</div>
            <div style={s.status}>🟢 {isAdmin ? "Admin (Verified)" : "Viewer Mode"}</div>
          </div>
        </div>
        <div style={s.tabBar}>
          <button onClick={() => setView('live')} style={view === 'live' ? s.tabA : s.tab}>LIVE</button>
          <button onClick={() => setView('history')} style={view === 'history' ? s.tabA : s.tab}>RECORDS</button>
          {!isAdmin ? (
            <button onClick={() => setView('login')} style={s.tab}>ADMIN</button>
          ) : (
            <button onClick={() => setView('setup')} style={s.goldTab}>+ NEW MATCH</button>
          )}
        </div>
      </div>

      {anim && <div style={s.popAnim}>{anim}</div>}

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div style={s.card}>
          <h3 style={{color:'#facc15'}}>Security Check</h3>
          <input type="password" placeholder="Enter PIN: 6545" style={s.input} onChange={e => setPassInp(e.target.value)} />
          <button onClick={() => { if(passInp === ADMIN_PASS) { setIsAdmin(true); setView('live'); } else alert("Access Denied!"); }} style={s.goldBtn}>UNLOCK SYSTEM</button>
        </div>
      )}

      {/* SETUP VIEW */}
      {view === 'setup' && (
        <form style={s.card} onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const p = (v: any) => v.split('\n').filter((l:any)=>l).map((l: any) => ({ name: l.split(',')[0], phone: l.split(',')[1] || '923015800630', r: 0, b: 0 }));
          const data = {
            league: fd.get('lg'), umpire: fd.get('up'), time: fd.get('tm'), target: fd.get('tr'), ground: fd.get('gr'),
            team1: { name: fd.get('t1'), players: p(fd.get('p1')) },
            team2: { name: fd.get('t2'), players: p(fd.get('p2')) },
            score: 0, wkts: 0, ovs: 0, balls: 0, striker: null, nonStriker: null, bowler: null
          };
          set(ref(db, 'liveMatch'), data); setView('live');
        }}>
          <input name="lg" placeholder="Match / League Title" style={s.input} required />
          <input name="up" placeholder="Empire Name" style={s.input} required />
          <input name="tm" placeholder="Start Time (e.g. 10:00 AM)" style={s.input} />
          <input name="gr" placeholder="Ground / Location" style={s.input} />
          <input name="tr" placeholder="Target" style={s.input} />
          <input name="t1" placeholder="Batting Team" style={s.input} required />
          <textarea name="p1" placeholder="Players (Name,Phone)" style={s.area} required />
          <input name="t2" placeholder="Bowling Team" style={s.input} required />
          <textarea name="p2" placeholder="Players (Name,Phone)" style={s.area} required />
          <button type="submit" style={s.goldBtn}>LAUNCH LIVE STREAM</button>
        </form>
      )}

      {/* LIVE SCOREBOARD */}
      {view === 'live' && match && (
        <div style={s.pad}>
          <div style={s.scoreBox}>
            <div style={s.meta}>{match.league} | {match.ground}</div>
            <div style={s.umpInfo}>Empire: {match.umpire} | 🕓 {match.time}</div>
            <div style={s.mainScore}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
            <div style={s.rrLine}>RR: {(match.score / (match.ovs + match.balls/6 || 1)).toFixed(2)} {match.target > 0 && `| Target: ${match.target}`}</div>
            {match.freeHit && <div style={s.fh}>FREE HIT ⚡</div>}
          </div>

          <div style={s.playerRow}>
            <div style={s.pCard} onClick={() => { if(isAdmin) { const i = prompt("Striker index (0-10)?") || "0"; set(ref(db, 'liveMatch/striker'), match.team1.players[i]); } }}>
              <span>🏏 {match.striker?.name || "SET STRIKER"}*</span>
              <b>{match.striker?.r || 0}({match.striker?.b || 0})</b>
            </div>
            <div style={s.pCard} onClick={() => { if(isAdmin) { const i = prompt("Non-Striker index (0-10)?") || "1"; set(ref(db, 'liveMatch/nonStriker'), match.team1.players[i]); } }}>
              <span>🏏 {match.nonStriker?.name || "SET NON-STRIKER"}</span>
              <b>{match.nonStriker?.r || 0}({match.nonStriker?.b || 0})</b>
            </div>
          </div>

          <div style={s.bowlerBox} onClick={() => { if(isAdmin) { const i = prompt("Bowler index (0-10)?") || "0"; set(ref(db, 'liveMatch/bowler'), match.team2.players[i]); } }}>
            ⚾ Current Bowler: {match.bowler?.name || "SELECT BOWLER"}
          </div>

          <div style={s.listCard}>
            <h3>{match.team1.name} Squad</h3>
            {match.team1.players.map((p:any, i:number) => (
              <div key={i} style={s.pListItem}>
                <span>{p.name} - {p.r || 0}({p.b || 0})</span>
                <button onClick={() => sendWhatsApp(p)} style={s.waBtn}>Report</button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div style={s.adminControls}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleAction(n)} style={s.nBtn}>{n}</button>)}
              <button onClick={() => handleAction(0, "WD")} style={s.eBtn}>WD</button>
              <button onClick={() => handleAction(0, "NB")} style={s.eBtn}>NB</button>
              <button onClick={() => handleAction(0, "W")} style={s.wBtn}>WICKET</button>
              <button onClick={() => { push(ref(db, 'history'), match); remove(ref(db, 'liveMatch')); }} style={s.saveBtn}>ARCHIVE MATCH</button>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div style={s.pad}>
          {history.length === 0 ? <div style={s.msg}>No Match History.</div> : history.map(h => (
            <div key={h.id} style={s.card}>
              <b>{h.team1?.name} vs {h.team2?.name}</b><br/>
              Score: {h.score}/{h.wkts} ({h.ovs}.{h.balls}) | {h.league}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: any = {
  app: { background: '#020617', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' },
  nav: { background: '#0f172a', padding: '15px', borderBottom: '2px solid #facc15' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  uName: { fontSize: '14px', fontWeight: 'bold', color: '#facc15' },
  status: { fontSize: '10px', color: '#22c55e' },
  tabBar: { display: 'flex', gap: '5px' },
  tab: { flex: 1, padding: '8px', background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' },
  tabA: { flex: 1, padding: '8px', background: '#facc15', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold' },
  goldTab: { flex: 1, padding: '8px', background: '#facc15', color: '#000', borderRadius: '8px', fontWeight: 'bold' },
  popAnim: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: '#000', padding: '40px 60px', borderRadius: '100px', fontSize: '40px', fontWeight: '900', zIndex: 1000, boxShadow: '0 0 80px #facc15' },
  scoreBox: { background: 'linear-gradient(to bottom, #1e293b, #020617)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155' },
  mainScore: { fontSize: '55px', fontWeight: '900', color: '#facc15', margin: '15px 0' },
  umpInfo: { color: '#facc15', fontSize: '13px' },
  meta: { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' },
  rrLine: { fontWeight: 'bold' },
  pad: { padding: '15px' },
  playerRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' },
  pCard: { background: '#0f172a', padding: '15px', borderRadius: '15px', border: '1px solid #334155' },
  bowlerBox: { marginTop: '10px', padding: '12px', background: '#1e293b', borderRadius: '12px', border: '1px solid #facc15', textAlign: 'center' },
  adminControls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' },
  nBtn: { padding: '18px', background: '#fff', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '20px' },
  eBtn: { background: '#facc15', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold' },
  wBtn: { gridColumn: 'span 4', background: '#ef4444', color: '#fff', padding: '18px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '18px' },
  saveBtn: { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '12px', border: 'none', borderRadius: '12px' },
  input: { width: '100%', padding: '15px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', marginBottom: '10px' },
  area: { width: '100%', height: '80px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', marginBottom: '10px', padding: '10px' },
  goldBtn: { width: '100%', padding: '15px', background: '#facc15', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '12px' },
  listCard: { background: '#0f172a', padding: '15px', borderRadius: '15px', marginTop: '20px' },
  pListItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' },
  waBtn: { background: '#22c55e', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '20px', fontSize: '10px' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#facc15' },
  fh: { color: '#ef4444', fontWeight: 'bold', marginTop: '10px' },
  card: { background: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #334155' },
  msg: { textAlign: 'center', marginTop: '50px', color: '#94a3b8' }
};
