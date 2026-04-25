import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg", // Make sure this matches your project
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const ADMIN_PASS = "6545";

export default function CricketApp() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'setup' | 'login' | 'history'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [animation, setAnimation] = useState("");
  const [activeTeamView, setActiveTeamView] = useState<number | null>(null);

  // Persistence for user login
  useEffect(() => {
    const isLogged = localStorage.getItem('isCricketAdmin');
    if (isLogged === 'true') setIsAdmin(true);

    onValue(ref(db, 'liveMatch'), (snap) => {
      setMatch(snap.val());
    });

    onValue(ref(db, 'history'), (snap) => {
      const data = snap.val();
      setHistory(data ? Object.entries(data).map(([id, val]: any) => ({ ...val, id })) : []);
    });
  }, []);

  const triggerAnim = (text: string) => {
    setAnimation(text);
    setTimeout(() => setAnimation(""), 3000);
  };

  const handleScore = (runs: number, type: string = "normal") => {
    if (!match || !isAdmin) return;
    let m = { ...match };
    
    // Intelligent Stats System
    if (type === "W") {
      m.wkts += 1; m.balls += 1; triggerAnim("OUT!");
      m.striker = null; // Forces admin to select new batsman
    } else if (type === "NB") {
      m.score += (runs + 1); m.freeHit = true; triggerAnim("NO BALL + FREE HIT");
    } else if (type === "WD") {
      m.score += (runs + 1); triggerAnim("WIDE");
    } else {
      m.score += runs; m.balls += 1; m.freeHit = false;
      if (runs === 4) triggerAnim("FOUR! 🔥");
      if (runs === 6) triggerAnim("SIXER! 🚀");
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if (m.balls === 6) {
      m.ovs += 1; m.balls = 0;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      m.bowler = null; // Reset bowler for next over
    }

    set(ref(db, 'liveMatch'), m);
  };

  const sendWhatsAppUpdate = (p: any) => {
    const text = `🏏 *Live Match Update*\n🏆 ${match.league}\n🏟️ ${match.ground}\n⚡ ${match.team1.name} vs ${match.team2.name}\n📊 Score: ${match.score}/${match.wkts}\n🥎 Overs: ${match.ovs}.${match.balls}\n👤 Umpire: ${match.umpire}\n🎯 Target: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/${p.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={styles.container}>
      {/* --- HEADER --- */}
      <div style={styles.header}>
        <div style={styles.profileRow}>
          <div style={styles.dp}>T</div>
          <div>
            <div style={styles.userName}>Touqeer Iqbal Baghoor</div>
            <div style={styles.status}>Umpire System Integrated</div>
          </div>
          {isAdmin && <button onClick={() => setView('setup')} style={styles.addBtn}>+ NEW MATCH</button>}
        </div>
        <div style={styles.nav}>
          <div onClick={() => setView('live')} style={view === 'live' ? styles.navActive : styles.navItem}>LIVE</div>
          <div onClick={() => setView('history')} style={view === 'history' ? styles.navActive : styles.navItem}>HISTORY</div>
          {!isAdmin && <div onClick={() => setView('login')} style={styles.navItem}>ADMIN</div>}
        </div>
      </div>

      {/* --- ANIMATION OVERLAY --- */}
      {animation && <div style={styles.animOverlay}>{animation}</div>}

      {/* --- LOGIN VIEW --- */}
      {view === 'login' && (
        <div style={styles.card}>
          <h3>Admin Login</h3>
          <input type="password" placeholder="Enter Code 6545" style={styles.input} onChange={e => setPassInput(e.target.value)} />
          <button onClick={() => {
            if(passInput === ADMIN_PASS) { setIsAdmin(true); localStorage.setItem('isCricketAdmin', 'true'); setView('live'); }
            else alert("Ghalat Password!");
          }} style={styles.btnGold}>LOGIN</button>
        </div>
      )}

      {/* --- SETUP VIEW --- */}
      {view === 'setup' && (
        <form style={styles.card} onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const parse = (v: any) => v.split('\n').map((l: any) => ({ name: l.split(',')[0], phone: l.split(',')[1] || '923015800630' }));
          const data = {
            league: fd.get('league'), ground: fd.get('ground'), umpire: fd.get('umpire'), time: fd.get('time'),
            team1: { name: fd.get('t1'), players: parse(fd.get('p1')) },
            team2: { name: fd.get('t2'), players: parse(fd.get('p2')) },
            score: 0, wkts: 0, ovs: 0, balls: 0, target: fd.get('target'), totalOvers: fd.get('totalOvers')
          };
          set(ref(db, 'liveMatch'), data); setView('live');
        }}>
          <input name="league" placeholder="League Name" style={styles.input} required />
          <input name="umpire" placeholder="Umpire Name" style={styles.input} required />
          <input name="ground" placeholder="Ground Name" style={styles.input} />
          <input name="time" placeholder="Match Time (e.g. 2:00 PM)" style={styles.input} />
          <input name="totalOvers" placeholder="Total Overs (e.g. 10)" style={styles.input} />
          <input name="target" placeholder="Target (Optional)" style={styles.input} />
          <input name="t1" placeholder="Batting Team Name" style={styles.input} />
          <textarea name="p1" placeholder="Batsmen (Name,WhatsAppNumber)" style={styles.area} />
          <input name="t2" placeholder="Bowling Team Name" style={styles.input} />
          <textarea name="p2" placeholder="Bowlers (Name,WhatsAppNumber)" style={styles.area} />
          <button type="submit" style={styles.btnGold}>START LIVE MATCH</button>
        </form>
      )}

      {/* --- LIVE VIEW --- */}
      {view === 'live' && match ? (
        <div style={styles.liveWrapper}>
          <div style={styles.scoreCard}>
            <div style={styles.matchMeta}>{match.league} | {match.time}</div>
            <div style={styles.umpireText}>Umpire: {match.umpire}</div>
            <div style={styles.mainScore}>{match.score}/{match.wkts} <span style={styles.overText}>({match.ovs}.{match.balls})</span></div>
            <div style={styles.rrLine}>RR: {(match.score / (match.ovs + (match.balls/6) || 1)).toFixed(2)} | Target: {match.target || 'TBD'}</div>
            {match.freeHit && <div style={styles.freeHitLabel}>FREE HIT!</div>}
          </div>

          <div style={styles.teamSelector}>
            <button onClick={() => setActiveTeamView(1)} style={styles.teamBtn}>{match.team1.name} (Players)</button>
            <button onClick={() => setActiveTeamView(2)} style={styles.teamBtn}>{match.team2.name} (Players)</button>
          </div>

          {activeTeamView && (
            <div style={styles.modal}>
              <h4>{activeTeamView === 1 ? match.team1.name : match.team2.name} List</h4>
              {(activeTeamView === 1 ? match.team1.players : match.team2.players).map((p: any, i: number) => (
                <div key={i} style={styles.playerRow}>
                  <span>{p.name}</span>
                  <div style={{display:'flex', gap: '10px'}}>
                    {isAdmin && <button onClick={() => {
                      let m = {...match};
                      if(activeTeamView === 1) m.striker = p; else m.bowler = p;
                      set(ref(db, 'liveMatch'), m); setActiveTeamView(null);
                    }} style={styles.selBtn}>Select</button>}
                    <span onClick={() => sendWhatsAppUpdate(p)} style={styles.waIcon}>📞</span>
                  </div>
                </div>
              ))}
              <button onClick={() => setActiveTeamView(null)} style={styles.closeBtn}>Close</button>
            </div>
          )}

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.label}>STRIKER</div>
              <div style={styles.val}>{match.striker?.name || '---'}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.label}>BOWLER</div>
              <div style={styles.val}>{match.bowler?.name || '---'}</div>
            </div>
          </div>

          {isAdmin && (
            <div style={styles.controls}>
              {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => handleScore(n)} style={styles.numBtn}>{n}</button>)}
              <button onClick={() => handleScore(0, "WD")} style={styles.exBtn}>WD</button>
              <button onClick={() => handleScore(0, "NB")} style={styles.exBtn}>NB</button>
              <button onClick={() => handleScore(0, "W")} style={styles.wktBtn}>WICKET OUT</button>
              <button onClick={() => {
                push(ref(db, 'history'), {...match, date: new Date().toLocaleString()});
                remove(ref(db, 'liveMatch'));
              }} style={styles.endBtn}>FINISH & SAVE HISTORY</button>
            </div>
          )}
        </div>
      ) : (
        view === 'live' && <div style={{textAlign:'center', marginTop:'50px'}}>Koi Match Live Nahi Hai.</div>
      )}

      {/* --- HISTORY VIEW --- */}
      {view === 'history' && (
        <div style={styles.pad}>
          {history.map((h) => (
            <div key={h.id} style={styles.histCard}>
              <div style={{fontWeight:'bold'}}>{h.team1.name} vs {h.team2.name}</div>
              <div style={{color:'#facc15'}}>{h.score}/{h.wkts} ({h.date})</div>
              {isAdmin && <button onClick={() => remove(ref(db, `history/${h.id}`))} style={styles.delBtn}>Delete</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { background: '#0a0e1a', minHeight: '100vh', color: '#fff', fontFamily: 'Arial' },
  header: { background: '#161d31', padding: '15px', borderBottom: '2px solid #facc15' },
  profileRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' },
  dp: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userName: { fontSize: '14px', fontWeight: 'bold', color: '#facc15' },
  status: { fontSize: '10px', color: '#22c55e' },
  addBtn: { marginLeft: 'auto', background: '#facc15', border: 'none', padding: '6px 12px', borderRadius: '5px', fontWeight: 'bold' },
  nav: { display: 'flex', gap: '10px' },
  navItem: { flex: 1, textAlign: 'center', padding: '8px', background: '#242b3d', borderRadius: '6px', fontSize: '12px' },
  navActive: { flex: 1, textAlign: 'center', padding: '8px', background: '#facc15', color: '#000', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  animOverlay: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: '#facc15', color: '#000', padding: '30px 60px', borderRadius: '100px', fontSize: '40px', fontWeight: '900', zIndex: 1000, boxShadow: '0 0 100px #facc15' },
  card: { margin: '20px', padding: '20px', background: '#161d31', borderRadius: '12px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#0a0e1a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  area: { width: '100%', height: '80px', padding: '12px', marginBottom: '10px', background: '#0a0e1a', border: '1px solid #334155', color: '#fff', borderRadius: '8px' },
  btnGold: { width: '100%', padding: '15px', background: '#facc15', border: 'none', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' },
  liveWrapper: { padding: '15px' },
  scoreCard: { background: 'linear-gradient(135deg, #161d31 0%, #242b3d 100%)', padding: '25px', borderRadius: '20px', textAlign: 'center', borderTop: '5px solid #facc15' },
  mainScore: { fontSize: '50px', fontWeight: '900', margin: '15px 0' },
  overText: { fontSize: '20px', color: '#94a3b8' },
  umpireText: { color: '#facc15', fontSize: '14px', fontWeight: 'bold' },
  freeHitLabel: { color: '#ef4444', fontWeight: 'bold', fontSize: '20px', animation: 'blink 1s infinite' },
  teamSelector: { display: 'flex', gap: '10px', marginTop: '20px' },
  teamBtn: { flex: 1, padding: '12px', background: '#161d31', border: '1px solid #facc15', color: '#fff', borderRadius: '10px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', padding: '40px', zIndex: 500 },
  playerRow: { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #334155' },
  waIcon: { background: '#22c55e', padding: '5px 10px', borderRadius: '50px', fontSize: '12px' },
  controls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '25px' },
  numBtn: { padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px' },
  exBtn: { background: '#facc15', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 4', background: '#ef4444', color: '#fff', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  endBtn: { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' },
  statBox: { background: '#161d31', padding: '15px', borderRadius: '12px' },
  label: { fontSize: '10px', color: '#64748b' },
  val: { fontWeight: 'bold', color: '#facc15' },
  histCard: { background: '#161d31', padding: '15px', borderRadius: '10px', marginBottom: '10px' },
  delBtn: { background: '#ef4444', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '4px', marginTop: '5px', fontSize: '10px' }
};
