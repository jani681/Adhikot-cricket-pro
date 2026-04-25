import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, push, remove } from "firebase/database";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const ADMIN_PASS = "6545";

export default function FinalCricketSystem() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'setup' | 'login' | 'history'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState("");
  const [anim, setAnim] = useState("");
  const [activeTeam, setActiveTeam] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Persistent Login
    if (localStorage.getItem('admin_auth') === 'true') setIsAdmin(true);

    const matchRef = ref(db, 'liveMatch');
    const historyRef = ref(db, 'history');

    const unsubMatch = onValue(matchRef, (snap) => {
      setMatch(snap.val());
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase Error:", err);
      setIsLoading(false);
    });

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
    let m = { ...match };
    
    if (type === "W") {
      m.wkts += 1; m.balls += 1; triggerAnim("OUT!");
      m.striker = null; m.freeHit = false;
    } else if (type === "NB") {
      m.score += (runs + 1); m.freeHit = true; triggerAnim("NO BALL!");
    } else if (type === "WD") {
      m.score += (runs + 1); triggerAnim("WIDE!");
    } else {
      m.score += runs; m.balls += 1; m.freeHit = false;
      if (runs === 4) triggerAnim("FOUR! 🔥");
      if (runs === 6) triggerAnim("SIX! 🚀");
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if (m.balls === 6) {
      m.ovs += 1; m.balls = 0;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      m.bowler = null;
    }
    set(ref(db, 'liveMatch'), m);
  };

  const sendWA = (p: any) => {
    const text = `🏏 *LIVE UPDATE*\n🏆 ${match?.league || 'Match'}\n📊 Score: ${match.score}/${match.wkts} (${match.ovs}.${match.balls})\n👤 Umpire: ${match.umpire}\n🎯 Target: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/${p.phone || '923015800630'}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Error Handling for Blank Screen
  if (isLoading) return <div style={s.loader}>System Loading...</div>;

  return (
    <div style={s.app}>
      {/* HEADER SECTION */}
      <div style={s.header}>
        <div style={s.flexRow}>
          <div style={s.dp}>T</div>
          <div style={{ flex: 1 }}>
            <div style={s.adminName}>Touqeer Iqbal Baghoor</div>
            <div style={s.status}>🟢 System Online</div>
          </div>
          {isAdmin && <button onClick={() => setView('setup')} style={s.setupBtn}>+ New</button>}
        </div>
        <div style={s.tabs}>
          <div onClick={() => setView('live')} style={view === 'live' ? s.tabActive : s.tab}>LIVE</div>
          <div onClick={() => setView('history')} style={view === 'history' ? s.tabActive : s.tab}>HISTORY</div>
        </div>
      </div>

      {anim && <div style={s.popAnim}>{anim}</div>}

      {/* LOGIN */}
      {view === 'login' && (
        <div style={s.card}>
          <input type="password" placeholder="Admin PIN: 6545" style={s.input} onChange={e => setPassInp(e.target.value)} />
          <button onClick={() => {
            if(passInp === ADMIN_PASS) { setIsAdmin(true); localStorage.setItem('admin_auth', 'true'); setView('live'); }
            else alert("Ghalat!");
          }} style={s.goldBtn}>UNLOCK ADMIN</button>
        </div>
      )}

      {/* SETUP */}
      {view === 'setup' && (
        <form style={s.card} onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const p = (v: any) => v.split('\n').map((l: any) => ({ name: l.split(',')[0], phone: l.split(',')[1] }));
          const data = {
            league: fd.get('lg'), umpire: fd.get('up'), ground: fd.get('gr'), time: fd.get('tm'),
            team1: { name: fd.get('t1'), players: p(fd.get('p1')) },
            team2: { name: fd.get('t2'), players: p(fd.get('p2')) },
            score: 0, wkts: 0, ovs: 0, balls: 0, target: fd.get('tr'), freeHit: false
          };
          set(ref(db, 'liveMatch'), data); setView('live');
        }}>
          <input name="lg" placeholder="League Name" style={s.input} required />
          <input name="up" placeholder="Umpire Name" style={s.input} required />
          <input name="gr" placeholder="Ground" style={s.input} />
          <input name="tm" placeholder="Time" style={s.input} />
          <input name="tr" placeholder="Target (Optional)" style={s.input} />
          <input name="t1" placeholder="Batting Team" style={s.input} />
          <textarea name="p1" placeholder="Players (Name,923xxx)" style={s.area} />
          <input name="t2" placeholder="Bowling Team" style={s.input} />
          <textarea name="p2" placeholder="Players (Name,923xxx)" style={s.area} />
          <button type="submit" style={s.goldBtn}>LAUNCH</button>
        </form>
      )}

      {/* LIVE VIEW */}
      {view === 'live' && (
        <div style={s.pad}>
          {!match ? <div style={s.msg}>No Live Match. Start from Admin.</div> : (
            <>
              <div style={s.scoreBox}>
                <div style={s.meta}>{match.league} | {match.time} | {match.ground}</div>
                <div style={s.ump}>Umpire: {match.umpire}</div>
                <div style={s.bigScore}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
                <div style={s.rrRow}>RR: {(match.score / (match.ovs + match.balls/6 || 1)).toFixed(2)} {match.target > 0 && `| Target: ${match.target}`}</div>
                {match.freeHit && <div style={s.fh}>FREE HIT ⚡</div>}
              </div>

              <div style={s.flexRow}>
                <button onClick={() => setActiveTeam(1)} style={s.teamBtn}>{match.team1.name}</button>
                <button onClick={() => setActiveTeam(2)} style={s.teamBtn}>{match.team2.name}</button>
              </div>

              {activeTeam && (
                <div style={s.modal}>
                  <h3>{activeTeam === 1 ? match.team1.name : match.team2.name}</h3>
                  {(activeTeam === 1 ? match.team1.players : match.team2.players).map((p: any, i: number) => (
                    <div key={i} style={s.pRow}>
                      <span>{p.name}</span>
                      <div style={s.flexRow}>
                        {isAdmin && <button onClick={() => {
                          let m = {...match};
                          if(activeTeam === 1) m.striker = p; else m.bowler = p;
                          set(ref(db, 'liveMatch'), m); setActiveTeam(null);
                        }} style={s.selBtn}>Select</button>}
                        <span onClick={() => sendWA(p)} style={s.wa}>WA</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setActiveTeam(null)} style={s.cls}>Close</button>
                </div>
              )}

              <div style={s.grid2}>
                <div style={s.stat}><span>STRIKER</span><br/><b>{match.striker?.name || '---'}</b></div>
                <div style={s.stat}><span>BOWLER</span><br/><b>{match.bowler?.name || '---'}</b></div>
              </div>

              {isAdmin && (
                <div style={s.controls}>
                  {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleAction(n)} style={s.num}>{n}</button>)}
                  <button onClick={() => handleAction(0, "WD")} style={s.ex}>WD</button>
                  <button onClick={() => handleAction(0, "NB")} style={s.ex}>NB</button>
                  <button onClick={() => handleAction(0, "W")} style={s.wkt}>WICKET</button>
                  <button onClick={() => { push(ref(db, 'history'), {...match, date: new Date().toLocaleDateString()}); remove(ref(db, 'liveMatch')); }} style={s.save}>END MATCH</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div style={s.pad}>
          {history.length === 0 ? "No history" : history.map(h => (
            <div key={h.id} style={s.card}>
              <b>{h.team1.name} vs {h.team2.name}</b><br/>
              Score: {h.score}/{h.wkts} | {h.date}
              {isAdmin && <button onClick={() => remove(ref(db, `history/${h.id}`))} style={s.del}>Delete</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: any = {
  app: { background: '#0a0b14', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui' },
  header: { background: '#161826', padding: '15px', borderBottom: '2px solid #facc15' },
  flexRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  dp: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: '#000', textAlign: 'center', lineHeight: '40px', fontWeight: 'bold' },
  adminName: { fontSize: '14px', fontWeight: 'bold', color: '#facc15' },
  status: { fontSize: '10px', color: '#22c55e' },
  setupBtn: { marginLeft: 'auto', background: '#facc15', border: 'none', borderRadius: '4px', padding: '5px 10px', fontWeight: 'bold' },
  tabs: { display: 'flex', gap: '5px', marginTop: '10px' },
  tab: { flex: 1, textAlign: 'center', padding: '8px', background: '#24273a', borderRadius: '6px', fontSize: '12px' },
  tabActive: { flex: 1, textAlign: 'center', padding: '8px', background: '#facc15', color: '#000', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  popAnim: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: '#000', padding: '30px 60px', borderRadius: '100px', fontSize: '40px', fontWeight: '900', zIndex: 1000, boxShadow: '0 0 80px #facc15' },
  pad: { padding: '15px' },
  scoreBox: { background: 'linear-gradient(135deg, #161826, #24273a)', padding: '20px', borderRadius: '15px', textAlign: 'center', borderTop: '4px solid #facc15' },
  bigScore: { fontSize: '45px', fontWeight: '900', margin: '10px 0' },
  meta: { fontSize: '10px', color: '#64748b' },
  ump: { color: '#facc15', fontWeight: 'bold', fontSize: '14px' },
  rrRow: { color: '#facc15', fontWeight: 'bold' },
  fh: { color: '#ef4444', animation: 'blink 1s infinite', fontWeight: 'bold' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' },
  stat: { background: '#161826', padding: '12px', borderRadius: '10px', fontSize: '12px' },
  teamBtn: { flex: 1, padding: '10px', background: '#161826', border: '1px solid #facc15', color: '#fff', borderRadius: '10px', marginTop: '15px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', padding: '40px', zIndex: 500 },
  pRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #334155' },
  wa: { background: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' },
  controls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '20px' },
  num: { padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  ex: { background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wkt: { gridColumn: 'span 4', background: '#ef4444', color: '#fff', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  save: { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '10px', border: 'none', borderRadius: '8px', marginTop: '5px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#161826', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  area: { width: '100%', height: '70px', padding: '10px', background: '#161826', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  goldBtn: { width: '100%', padding: '15px', background: '#facc15', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  msg: { textAlign: 'center', marginTop: '50px', color: '#64748b' },
  loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0b14', color: '#facc15' },
  selBtn: { background: '#facc15', border: 'none', borderRadius: '4px', padding: '2px 8px', color: '#000', fontSize: '10px' },
  cls: { width: '100%', padding: '12px', background: '#ef4444', border: 'none', color: '#fff', marginTop: '20px', borderRadius: '8px' },
  card: { background: '#161826', padding: '15px', borderRadius: '10px', marginBottom: '10px' },
  del: { background: '#ef4444', border: 'none', color: '#fff', padding: '4px 8px', fontSize: '10px', borderRadius: '4px', marginTop: '5px' }
};
