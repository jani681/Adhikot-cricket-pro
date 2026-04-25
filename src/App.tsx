import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, push, remove } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_PASS = "6545";

export default function IntelligentCricketApp() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'setup' | 'login' | 'history'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState("");
  const [showTeam, setShowTeam] = useState<number | null>(null);
  const [anim, setAnim] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
    onValue(ref(db, 'history'), (snap) => {
      const data = snap.val();
      setHistory(data ? Object.entries(data).map(([id, val]: any) => ({ ...val, id })) : []);
    });
  }, []);

  // --- Logic Functions ---
  const triggerAnim = (txt: string) => {
    setAnim(txt);
    setTimeout(() => setAnim(""), 2500);
  };

  const handleScore = (runs: number, extra: string = "") => {
    if (!match || !isAdmin) return;
    let m = { ...match };
    const sIdx = m.team1.players.findIndex((p: any) => p.name === m.striker?.name);
    const bIdx = m.team2.players.findIndex((p: any) => p.name === m.bowler?.name);

    if (extra === "W") {
      m.wkts += 1; m.balls += 1; triggerAnim("OUT!");
      if (sIdx !== -1) m.team1.players[sIdx].b += 1;
      m.striker = null;
      m.freeHit = false;
    } else if (extra === "NB" || extra === "WD") {
      m.score += (runs + 1);
      triggerAnim(extra);
      if (extra === "NB") m.freeHit = true;
      if (bIdx !== -1) m.team2.players[bIdx].r += (runs + 1);
    } else {
      m.score += runs; m.balls += 1;
      if (runs === 4) triggerAnim("FOUR!");
      if (runs === 6) triggerAnim("SIX!");
      if (sIdx !== -1) {
        m.team1.players[sIdx].r += runs;
        m.team1.players[sIdx].b += 1;
        if (runs === 4) m.team1.players[sIdx].f4 += 1;
        if (runs === 6) m.team1.players[sIdx].s6 += 1;
      }
      if (bIdx !== -1) m.team2.players[bIdx].r += runs;
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      m.freeHit = false;
    }

    if (m.balls === 6) {
      m.ovs += 1; m.balls = 0;
      if (bIdx !== -1) m.team2.players[bIdx].o += 1;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      m.bowler = null;
    }
    set(ref(db, 'liveMatch'), m);
  };

  const saveToHistory = () => {
    if (match) {
      push(ref(db, 'history'), { ...match, date: new Date().toLocaleDateString() });
      remove(ref(db, 'liveMatch'));
    }
  };

  const sendWhatsApp = (p: any) => {
    const msg = `🏏 Live Update\nMatch: ${match.team1.name} vs ${match.team2.name}\nScore: ${match.score}/${match.wkts} (${match.ovs}.${match.balls})\nUmpire: ${match.umpire}\nTarget: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/${p.phone || '923015800630'}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={s.app}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.row}>
          <div style={s.avatar}>T</div>
          <div style={{ flex: 1 }}>
            <div style={s.hName}>Touqeer Iqbal Baghoor</div>
            <div style={s.hSub}>Umpire System Integrated</div>
          </div>
          <button onClick={() => setView(isAdmin ? 'setup' : 'login')} style={s.topBtn}>+ Match</button>
        </div>
        <div style={s.tabs}>
          <div onClick={() => setView('live')} style={view === 'live' ? s.tabAct : s.tab}>Live</div>
          <div onClick={() => setView('history')} style={view === 'history' ? s.tabAct : s.tab}>History</div>
        </div>
      </div>

      {/* VIEW: LOGIN */}
      {view === 'login' && (
        <div style={s.pad}>
          <input type="password" placeholder="PIN: 6545" style={s.input} onChange={e => setPassInp(e.target.value)} />
          <button onClick={() => passInp === ADMIN_PASS ? (setIsAdmin(true), setView('setup')) : alert("Wrong")} style={s.mainBtn}>ENTER SYSTEM</button>
        </div>
      )}

      {/* VIEW: SETUP */}
      {view === 'setup' && (
        <form style={s.pad} onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const p = (v: any) => v.split('\n').map((l: any) => ({ name: l.split(',')[0], phone: l.split(',')[1], r: 0, b: 0, f4: 0, s6: 0, o: 0, w: 0 }));
          const data = {
            umpire: fd.get('umpire'), time: fd.get('time'), ground: fd.get('ground'),
            team1: { name: fd.get('t1'), players: p(fd.get('p1')) },
            team2: { name: fd.get('t2'), players: p(fd.get('p2')) },
            score: 0, wkts: 0, ovs: 0, balls: 0, freeHit: false, target: 0
          };
          set(ref(db, 'liveMatch'), data); setView('live');
        }}>
          <input name="umpire" placeholder="Umpire Name" style={s.input} />
          <input name="time" placeholder="Match Time (e.g 10:00 AM)" style={s.input} />
          <input name="ground" placeholder="Ground Name" style={s.input} />
          <input name="t1" placeholder="Team 1 Name" style={s.input} />
          <textarea name="p1" placeholder="T1 Players (Name,92300... one per line)" style={s.area} />
          <input name="t2" placeholder="Team 2 Name" style={s.input} />
          <textarea name="p2" placeholder="T2 Players (Name,92300... one per line)" style={s.area} />
          <button type="submit" style={s.mainBtn}>LAUNCH MATCH</button>
        </form>
      )}

      {/* VIEW: LIVE */}
      {view === 'live' && match && (
        <div style={s.pad}>
          {/* Animation Overlay */}
          {anim && <div style={s.animPop}>{anim}</div>}

          <div style={s.liveCard}>
            <div style={s.meta}>{match.time} | {match.ground} | Umpire: {match.umpire}</div>
            <div style={s.score}>{match.score}/{match.wkts} <small style={{ fontSize: '18px' }}>({match.ovs}.{match.balls})</small></div>
            <div style={s.rrRow}>
              <span>RR: {(match.score / (match.ovs + match.balls / 6 || 1)).toFixed(2)}</span>
              {match.freeHit && <span style={s.freeHit}>FREE HIT</span>}
            </div>
          </div>

          {/* Teams List (Clickable) */}
          <div style={s.teamRow}>
            <button onClick={() => setShowTeam(1)} style={s.tBtn}>{match.team1.name}</button>
            <button onClick={() => setShowTeam(2)} style={s.tBtn}>{match.team2.name}</button>
          </div>

          {showTeam && (
            <div style={s.playerList}>
              <div style={s.listHead}>Players List - {showTeam === 1 ? match.team1.name : match.team2.name}</div>
              {(showTeam === 1 ? match.team1.players : match.team2.players).map((p: any, i: number) => (
                <div key={i} style={s.pItem}>
                  <span>{p.name}</span>
                  <div style={s.row}>
                    {isAdmin && (
                      <button onClick={() => {
                        let m = { ...match };
                        if (showTeam === 1) m.striker = p; else m.bowler = p;
                        set(ref(db, 'liveMatch'), m); setShowTeam(null);
                      }} style={s.selBtn}>Select</button>
                    )}
                    <span onClick={() => sendWhatsApp(p)} style={s.waIco}>📞</span>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowTeam(null)} style={s.clsBtn}>Close</button>
            </div>
          )}

          {/* Striker/Bowler Stats */}
          <div style={s.statsGrid}>
            <div style={s.statBox}>
              <div style={s.statLabel}>Batsman (Striker)</div>
              <div style={s.statVal}>{match.striker?.name || '---'}</div>
              <div style={s.statSub}>{match.striker?.r || 0}({match.striker?.b || 0}) | 4s: {match.striker?.f4 || 0} 6s: {match.striker?.s6 || 0}</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>Bowler</div>
              <div style={s.statVal}>{match.bowler?.name || '---'}</div>
              <div style={s.statSub}>Ovs: {match.bowler?.o || 0} | Runs: {match.bowler?.r || 0}</div>
            </div>
          </div>

          {/* ADMIN CONTROLS */}
          {isAdmin && (
            <div style={s.ctrls}>
              {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => handleScore(n)} style={s.num}>{n}</button>)}
              <button onClick={() => handleScore(0, "WD")} style={s.ex}>WD</button>
              <button onClick={() => handleScore(0, "NB")} style={s.ex}>NB</button>
              <button onClick={() => handleScore(0, "W")} style={s.wkt}>WICKET</button>
              <button onClick={saveToHistory} style={s.save}>SAVE MATCH HISTORY</button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: HISTORY */}
      {view === 'history' && (
        <div style={s.pad}>
          {history.map((h) => (
            <div key={h.id} style={s.histItem}>
              <div>{h.team1.name} vs {h.team2.name}</div>
              <div style={s.histScore}>{h.score}/{h.wkts} ({h.date})</div>
              {isAdmin && <button onClick={() => remove(ref(db, `history/${h.id}`))} style={s.del}>Delete</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: any = {
  app: { background: '#0a0f1e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#161d31', padding: '15px', borderBottom: '2px solid #facc15' },
  row: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  hName: { fontWeight: 'bold', fontSize: '14px', color: '#facc15' },
  hSub: { fontSize: '10px', color: '#22c55e' },
  topBtn: { background: '#facc15', border: 'none', padding: '5px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  tabs: { display: 'flex', marginTop: '15px', gap: '5px' },
  tab: { flex: 1, textAlign: 'center', padding: '8px', background: '#242b3d', borderRadius: '5px', fontSize: '12px' },
  tabAct: { flex: 1, textAlign: 'center', padding: '8px', background: '#facc15', color: '#000', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  pad: { padding: '20px' },
  liveCard: { background: '#161d31', padding: '20px', borderRadius: '15px', textAlign: 'center', borderTop: '4px solid #facc15', position: 'relative' },
  score: { fontSize: '45px', fontWeight: '900', margin: '10px 0' },
  meta: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' },
  rrRow: { display: 'flex', justifyContent: 'center', gap: '15px', color: '#facc15', fontWeight: 'bold' },
  freeHit: { color: '#ef4444', animation: 'blink 1s infinite' },
  teamRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  tBtn: { flex: 1, padding: '12px', background: '#242b3d', border: '1px solid #334155', color: '#fff', borderRadius: '10px' },
  playerList: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, padding: '30px' },
  listHead: { fontSize: '18px', fontWeight: 'bold', color: '#facc15', marginBottom: '20px' },
  pItem: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #334155' },
  waIco: { background: '#22c55e', padding: '5px 10px', borderRadius: '50px', fontSize: '12px' },
  selBtn: { background: '#facc15', color: '#000', border: 'none', borderRadius: '4px', padding: '2px 8px', marginRight: '10px' },
  clsBtn: { width: '100%', padding: '15px', background: '#ef4444', border: 'none', color: '#fff', marginTop: '20px', borderRadius: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' },
  statBox: { background: '#161d31', padding: '15px', borderRadius: '10px', border: '1px solid #334155' },
  statLabel: { fontSize: '10px', color: '#64748b' },
  statVal: { fontWeight: 'bold', color: '#facc15' },
  statSub: { fontSize: '10px', marginTop: '5px' },
  ctrls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '20px' },
  num: { padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  ex: { background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wkt: { gridColumn: 'span 4', background: '#ef4444', color: '#fff', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  save: { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', fontSize: '12px', marginTop: '10px' },
  animPop: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: '#000', padding: '20px 40px', borderRadius: '50px', fontWeight: '900', fontSize: '30px', zIndex: 200, boxShadow: '0 0 50px #facc15' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#161d31', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  area: { width: '100%', padding: '12px', background: '#161d31', border: '1px solid #334155', color: '#fff', borderRadius: '8px', height: '80px' },
  mainBtn: { width: '100%', padding: '15px', background: '#facc15', border: 'none', fontWeight: 'bold', borderRadius: '8px' },
  histItem: { background: '#161d31', padding: '15px', borderRadius: '10px', marginBottom: '10px' },
  histScore: { color: '#facc15', fontSize: '12px' },
  del: { background: '#ef4444', border: 'none', color: '#fff', padding: '4px 8px', fontSize: '10px', borderRadius: '4px', marginTop: '5px' }
};
