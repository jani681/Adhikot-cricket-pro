import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const ADMIN_PASS = "6545";

export default function AdhikotCricketProV3() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'setup' | 'history' | 'login'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState("");
  const [anim, setAnim] = useState("");
  const [showTeamModal, setShowTeamModal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const histRef = ref(db, 'history');
    
    const unsubMatch = onValue(matchRef, (snap) => {
      setMatch(snap.val());
      setLoading(false);
    }, () => setLoading(false));

    const unsubHist = onValue(histRef, (snap) => {
      const data = snap.val();
      setHistory(data ? Object.entries(data).map(([id, v]: any) => ({ ...v, id })) : []);
    });

    return () => { unsubMatch(); unsubHist(); };
  }, []);

  const triggerAnim = (txt: string) => {
    setAnim(txt);
    setTimeout(() => setAnim(""), 2500);
  };

  const sendWhatsApp = (player: any) => {
    if (!match) return;
    const text = `🏏 *LIVE UPDATE*\n🏆 ${match.league}\n📊 ${match.team1.name} vs ${match.team2.name}\n🔥 Score: ${match.score}/${match.wkts} (${match.overs}.${match.balls})\n🎯 Target: ${match.target}\n👤 Umpire: ${match.umpire}`;
    window.open(`https://wa.me/${player.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAction = (runs: number, type: string = "reg") => {
    if (!isAdmin || !match) return;
    let m = { ...match };
    
    if (type === "W") {
      m.wkts += 1; m.balls += 1; triggerAnim("OUT! ☝️");
      m.striker = null; 
    } else if (type === "WD") {
      m.score += (runs + 1); triggerAnim("WIDE ↔️");
    } else if (type === "NB") {
      m.score += (runs + 1); m.freeHit = true; triggerAnim("NO BALL ⚠️");
    } else {
      m.score += runs; m.balls += 1; m.freeHit = false;
      if (runs === 4) triggerAnim("FOUR! 🏏");
      if (runs === 6) triggerAnim("SIX! 🚀");
      
      // Batsman Stats Update
      if (m.striker) {
        m.striker.runs = (m.striker.runs || 0) + runs;
        m.striker.balls = (m.striker.balls || 0) + 1;
      }
      
      // Strike Rotation
      if (runs % 2 !== 0) {
        let temp = m.striker; m.striker = m.nonStriker; m.nonStriker = temp;
      }
    }

    if (m.balls >= 6) {
      m.overs += 1; m.balls = 0;
      let temp = m.striker; m.striker = m.nonStriker; m.nonStriker = temp;
      m.bowler = null; // Over end, select new bowler
    }

    set(ref(db, 'liveMatch'), m);
  };

  if (loading) return <div style={s.loader}>Loading Adhikot System...</div>;

  return (
    <div style={s.app}>
      {/* Navbar */}
      <div style={s.nav}>
        <div style={s.profile}>
          <div style={s.avatar}>T</div>
          <div>
            <div style={s.uName}>Touqeer Iqbal Baghoor</div>
            <div style={s.uSub}>{isAdmin ? "Admin Mode Active" : "Umpire System Integrated"}</div>
          </div>
        </div>
        <div style={s.tabGroup}>
          <button onClick={() => setView('live')} style={view === 'live' ? s.tabA : s.tab}>Live</button>
          <button onClick={() => setView('history')} style={view === 'history' ? s.tabA : s.tab}>History</button>
          {!isAdmin ? 
            <button onClick={() => setView('login')} style={s.tab}>Admin</button> :
            <button onClick={() => setView('setup')} style={s.tabGold}>+ Match</button>
          }
        </div>
      </div>

      {anim && <div style={s.animOverlay}>{anim}</div>}

      {/* Login View */}
      {view === 'login' && (
        <div style={s.card}>
          <h3>🔐 Admin Access</h3>
          <input type="password" placeholder="Enter PIN (6545)" style={s.input} onChange={e => setPassInp(e.target.value)} />
          <button onClick={() => { if(passInp===ADMIN_PASS) {setIsAdmin(true); setView('live');} else alert("Wrong!"); }} style={s.btnG}>Login</button>
        </div>
      )}

      {/* Setup View */}
      {view === 'setup' && (
        <form style={s.card} onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const parseP = (v: any) => v.split('\n').map((l: any) => ({ name: l.split(',')[0], phone: l.split(',')[1] || '923000000000', runs: 0, balls: 0 }));
          const matchData = {
            league: fd.get('lg'), umpire: fd.get('up'), ground: fd.get('gr'), time: fd.get('tm'), target: fd.get('tr'),
            team1: { name: fd.get('t1'), players: parseP(fd.get('p1')) },
            team2: { name: fd.get('t2'), players: parseP(fd.get('p2')) },
            score: 0, wkts: 0, overs: 0, balls: 0, freeHit: false, striker: null, nonStriker: null, bowler: null
          };
          set(ref(db, 'liveMatch'), matchData); setView('live');
        }}>
          <input name="lg" placeholder="League Name" style={s.input} required />
          <input name="up" placeholder="Umpire Name" style={s.input} required />
          <input name="gr" placeholder="Ground" style={s.input} />
          <input name="tm" placeholder="Match Time (e.g 9:00 PM)" style={s.input} />
          <input name="tr" placeholder="Target Score" style={s.input} />
          <input name="t1" placeholder="Batting Team" style={s.input} required />
          <textarea name="p1" placeholder="Batsmen (Name,Phone)" style={s.area} required />
          <input name="t2" placeholder="Bowling Team" style={s.input} required />
          <textarea name="p2" placeholder="Bowlers (Name,Phone)" style={s.area} required />
          <button type="submit" style={s.btnG}>START PRO MATCH</button>
        </form>
      )}

      {/* Live Match View */}
      {view === 'live' && match && (
        <div style={s.liveContainer}>
          <div style={s.scoreBox}>
            <div style={s.meta}>{match.league} | {match.ground}</div>
            <div style={s.umpireText}>Umpire: {match.umpire} | Time: {match.time}</div>
            <div style={s.bigScore}>{match.score}/{match.wkts} <small>({match.overs}.{match.balls})</small></div>
            <div style={s.rrLine}>RR: {(match.score / (match.overs + match.balls/6 || 1)).toFixed(2)} | Target: {match.target}</div>
            {match.freeHit && <div style={s.fhBadge}>FREE HIT ⚡</div>}
          </div>

          {/* Player Selection & Stats */}
          <div style={s.playerGrid}>
            <div style={s.pCard} onClick={() => isAdmin && setShowTeamModal(1)}>
              <span>🏏 {match.striker?.name || "Select Striker"}*</span>
              <b>{match.striker?.runs || 0}({match.striker?.balls || 0})</b>
            </div>
            <div style={s.pCard} onClick={() => isAdmin && setShowTeamModal(1)}>
              <span>🏏 {match.nonStriker?.name || "Select Non-Striker"}</span>
              <b>{match.nonStriker?.runs || 0}({match.nonStriker?.balls || 0})</b>
            </div>
            <div style={s.pCard} onClick={() => isAdmin && setShowTeamModal(2)} style={{gridColumn: 'span 2', borderColor: '#facc15'}}>
              <span>⚾ Bowler: {match.bowler?.name || "Select Bowler"}</span>
            </div>
          </div>

          <div style={s.teamBtnRow}>
             <button onClick={() => setShowTeamModal(1)} style={s.tBtn}>{match.team1.name}</button>
             <button onClick={() => setShowTeamModal(2)} style={s.tBtn}>{match.team2.name}</button>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div style={s.controlGrid}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => handleAction(n)} style={s.numBtn}>{n}</button>)}
              <button onClick={() => handleAction(0, "WD")} style={s.exBtn}>WD</button>
              <button onClick={() => handleAction(0, "NB")} style={s.exBtn}>NB</button>
              <button onClick={() => handleAction(0, "W")} style={s.wktBtn}>WICKET OUT</button>
              <button onClick={() => { if(window.confirm("Finish?")) { push(ref(db,'history'), match); remove(ref(db,'liveMatch')); }}} style={s.endBtn}>FINISH & SAVE</button>
            </div>
          )}
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div style={s.modal}>
          <div style={s.modalInner}>
            <h3>Select Player ({showTeamModal === 1 ? match.team1.name : match.team2.name})</h3>
            {(showTeamModal === 1 ? match.team1.players : match.team2.players).map((p: any, i: number) => (
              <div key={i} style={s.listRow}>
                <span>{p.name}</span>
                <div style={s.rowActions}>
                  {isAdmin && <button onClick={() => {
                    let m = {...match};
                    if(showTeamModal === 1) { if(!m.striker) m.striker = p; else m.nonStriker = p; }
                    else m.bowler = p;
                    set(ref(db, 'liveMatch'), m); setShowTeamModal(null);
                  }} style={s.selBtn}>Select</button>}
                  <button onClick={() => sendWhatsApp(p)} style={s.waBtn}>WhatsApp</button>
                </div>
              </div>
            ))}
            <button onClick={() => setShowTeamModal(null)} style={s.closeBtn}>Close</button>
          </div>
        </div>
      )}

      {view === 'live' && !match && <div style={s.empty}>Koi Match Live Nahi Hai.</div>}
    </div>
  );
}

const s: any = {
  app: { background: '#0a0b14', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui' },
  nav: { background: '#161826', padding: '15px', borderBottom: '2px solid #facc15' },
  profile: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  avatar: { width: '45px', height: '45px', background: '#facc15', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' },
  uName: { fontSize: '16px', fontWeight: 'bold', color: '#facc15' },
  uSub: { fontSize: '11px', color: '#22c55e' },
  tabGroup: { display: 'flex', gap: '8px' },
  tab: { flex: 1, padding: '10px', background: '#24273a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px' },
  tabA: { flex: 1, padding: '10px', background: '#facc15', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold' },
  tabGold: { flex: 1, padding: '10px', background: '#facc15', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold' },
  liveContainer: { padding: '15px' },
  scoreBox: { background: 'linear-gradient(180deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155' },
  bigScore: { fontSize: '55px', fontWeight: '900', margin: '15px 0', color: '#facc15' },
  meta: { fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' },
  umpireText: { color: '#facc15', fontSize: '14px' },
  rrLine: { fontSize: '15px', fontWeight: 'bold', color: '#fff' },
  playerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' },
  pCard: { background: '#161826', padding: '15px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' },
  controlGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '25px' },
  numBtn: { padding: '18px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '20px' },
  exBtn: { background: '#facc15', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 4', background: '#ef4444', color: '#fff', padding: '18px', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px' },
  endBtn: { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '15px', border: 'none', borderRadius: '12px' },
  animOverlay: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', background: '#facc15', color: '#000', padding: '40px 60px', borderRadius: '100px', fontSize: '45px', fontWeight: '900', zIndex: 9999, boxShadow: '0 0 100px rgba(250,204,21,0.5)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 },
  modalInner: { background: '#161826', width: '100%', borderRadius: '20px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #334155' },
  waBtn: { background: '#25D366', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '11px' },
  selBtn: { background: '#facc15', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', marginRight: '5px' },
  closeBtn: { width: '100%', padding: '15px', marginTop: '20px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '12px' },
  input: { width: '100%', padding: '15px', background: '#161826', border: '1px solid #334155', color: '#fff', borderRadius: '12px', marginBottom: '10px' },
  area: { width: '100%', height: '100px', background: '#161826', border: '1px solid #334155', color: '#fff', borderRadius: '12px', marginBottom: '10px', padding: '10px' },
  btnG: { width: '100%', padding: '18px', background: '#facc15', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '12px' },
  fhBadge: { color: '#ef4444', fontWeight: 'bold', animation: 'blink 1s infinite' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b14', color: '#facc15', fontSize: '20px' },
  empty: { textAlign: 'center', marginTop: '100px', color: '#64748b' },
  tBtn: { flex: 1, padding: '12px', background: '#24273a', border: '1px solid #facc15', color: '#fff', borderRadius: '10px' },
  teamBtnRow: { display: 'flex', gap: '10px', marginTop: '15px' }
};
