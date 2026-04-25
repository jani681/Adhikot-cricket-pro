import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push } from "firebase/database";

// Firebase Configuration (As per your Screenshot)
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_NAME = "Touqeer Iqbal Baghoor";
const ADMIN_PASS = "6545";
const ADMIN_WA = "923015800630";

export default function AdhiKotCricketPro() {
  const [view, setView] = useState<'live' | 'setup' | 'login' | 'history'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [passInput, setPassInput] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snapshot) => {
      setMatch(snapshot.val());
    });
    onValue(ref(db, 'history'), (snapshot) => {
      const data = snapshot.val();
      if (data) setHistory(Object.values(data).reverse());
    });
  }, []);

  // --- Core Logic ---
  const handleAction = (runs: number, extra: string = "") => {
    if (!isAdmin || !match) return;
    let m = { ...match };
    const sIdx = m.batsmen.findIndex((p: any) => p.name === m.striker.name);

    if (extra === "W") {
      m.wkts += 1; m.balls += 1; m.batsmen[sIdx].b += 1;
      m.striker = null; 
    } else if (extra === "WD" || extra === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs; m.balls += 1;
      m.batsmen[sIdx].r += runs; m.batsmen[sIdx].b += 1;
      if (runs === 4) m.batsmen[sIdx].f4 += 1;
      if (runs === 6) m.batsmen[sIdx].s6 += 1;
      if (runs === 0) m.batsmen[sIdx].d0 += 1;
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if (m.balls === 6) {
      m.ovs += 1; m.balls = 0;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    set(ref(db, 'liveMatch'), m);
  };

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parsePlayers = (str: any) => str.split(',').map((s:any) => ({ name: s.trim(), r: 0, b: 0, f4: 0, s6: 0, d0: 0 }));
    
    const newMatch = {
      league: fd.get('league'), umpire: fd.get('umpire'), ground: fd.get('ground'),
      toss: `${fd.get('tossWinner')} won & elected to ${fd.get('tossChoice')}`,
      batTeam: fd.get('batTeam'), bowTeam: fd.get('bowTeam'),
      batsmen: parsePlayers(fd.get('batsmenNames')),
      bowlers: parsePlayers(fd.get('bowlersNames')),
      score: 0, wkts: 0, ovs: 0, balls: 0, striker: null, nonStriker: null, inning: 1, target: 0
    };
    set(ref(db, 'liveMatch'), newMatch);
    setView('live');
  };

  const endInning = () => {
    let m = { ...match };
    if (m.inning === 1) {
      m.target = m.score + 1;
      m.inning = 2; m.score = 0; m.wkts = 0; m.ovs = 0; m.balls = 0;
      m.striker = null; m.nonStriker = null;
      set(ref(db, 'liveMatch'), m);
    } else {
      push(ref(db, 'history'), { ...m, timestamp: Date.now() });
      set(ref(db, 'liveMatch'), null);
    }
  };

  const sendWhatsApp = (player: string) => {
    const text = `🏏 Live Update from ${match.league}\nScore: ${match.score}/${match.wkts} (${match.ovs}.${match.balls})\n${player} is on crease!`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={styles.app}>
      {/* Navbar */}
      <div style={styles.nav}>
        <div style={styles.adminBox}>
          <div style={styles.avatar}>T</div>
          <div>
            <div style={styles.adminName}>{ADMIN_NAME}</div>
            <div style={styles.waTag}>🟢 WhatsApp Admin</div>
          </div>
        </div>
        <div style={styles.navBtns}>
          <button onClick={() => setView('live')} style={view === 'live' ? styles.activeTab : styles.tab}>Live</button>
          <button onClick={() => setView('history')} style={view === 'history' ? styles.activeTab : styles.tab}>History</button>
          <button onClick={() => isAdmin ? setView('setup') : setView('login')} style={styles.addBtn}>+ Match</button>
        </div>
      </div>

      {/* Login View */}
      {view === 'login' && (
        <div style={styles.container}>
          <input type="password" placeholder="Admin PIN" style={styles.input} onChange={e => setPassInput(e.target.value)} />
          <button onClick={() => passInput === ADMIN_PASS ? (setIsAdmin(true), setView('setup')) : alert("Wrong PIN")} style={styles.mainBtn}>LOGIN</button>
        </div>
      )}

      {/* Setup View */}
      {view === 'setup' && (
        <form onSubmit={startMatch} style={styles.container}>
          <input name="league" placeholder="League Name" style={styles.input} required />
          <input name="umpire" placeholder="Umpire Name" style={styles.input} required />
          <input name="ground" placeholder="Ground" style={styles.input} required />
          <div style={{display:'flex', gap:'10px'}}>
            <input name="tossWinner" placeholder="Toss Winner" style={styles.input} />
            <select name="tossChoice" style={styles.input}><option value="Bat">Bat</option><option value="Bowl">Bowl</option></select>
          </div>
          <input name="batTeam" placeholder="Batting Team" style={styles.input} required />
          <textarea name="batsmenNames" placeholder="Batsmen Names (Comma separated)" style={styles.area} required />
          <input name="bowTeam" placeholder="Bowling Team" style={styles.input} required />
          <textarea name="bowlersNames" placeholder="Bowlers Names (Comma separated)" style={styles.area} required />
          <button type="submit" style={styles.mainBtn}>START MATCH</button>
        </form>
      )}

      {/* Live View */}
      {view === 'live' && match && (
        <div style={styles.liveCard}>
          <div style={styles.matchMeta}>
            {match.league} | {match.ground}<br />Umpire: {match.umpire}
          </div>
          <div style={styles.bigScore}>{match.score}/{match.wkts} <span style={{fontSize:'24px'}}>({match.ovs}.{match.balls})</span></div>
          <div style={styles.tossLine}>{match.toss}</div>
          {match.inning === 2 && <div style={styles.targetBox}>Target: {match.target} | Needs {match.target - match.score} in {(36 - (match.ovs * 6 + match.balls))} balls</div>}

          {/* Batsmen Table */}
          <div style={styles.statsTable}>
            <div style={styles.tableHeader}><span>Batsman</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>0s</span><span>WA</span></div>
            {[match.striker, match.nonStriker].map((p, i) => (
              <div key={i} style={styles.tableRow} onClick={() => isAdmin && !p && set(ref(db, 'liveMatch'), { ...match, [i === 0 ? 'striker' : 'nonStriker']: match.batsmen[0] })}>
                <span style={{flex:2}}>{p ? `${p.name}${i === 0 ? '*' : ''}` : 'Select Player'}</span>
                <span>{p?.r || 0}</span><span>{p?.b || 0}</span><span>{p?.f4 || 0}</span><span>{p?.s6 || 0}</span><span>{p?.d0 || 0}</span>
                <span onClick={(e) => { e.stopPropagation(); p && sendWhatsApp(p.name); }}><WhatsAppIcon color={p ? '#22c55e' : '#64748b'} /></span>
              </div>
            ))}
          </div>

          {/* Scoring Buttons */}
          {isAdmin && (
            <>
              <div style={styles.btnGrid}>
                {[0, 1, 2, 3, 4, 6].map(n => <button key={n} onClick={() => handleAction(n)} style={styles.scoreBtn}>{n}</button>)}
                <button onClick={() => handleAction(0, "WD")} style={styles.exBtn}>WD</button>
                <button onClick={() => handleAction(0, "NB")} style={styles.exBtn}>NB</button>
                <button onClick={() => handleAction(0, "W")} style={styles.wktBtn}>WICKET OUT</button>
              </div>
              <button onClick={endInning} style={styles.endBtn}>{match.inning === 1 ? 'END 1ST INNING' : 'MATCH FINISHED & SAVE'}</button>
            </>
          )}
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div style={styles.container}>
          {history.map((h, i) => (
            <div key={i} style={styles.historyItem}>
              <strong>{h.league}</strong>: {h.score}/{h.wkts} ({h.ovs}.{h.balls} ovs)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const WhatsAppIcon = ({ color }: any) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.41 0 .01 5.399.007 12.039c0 2.122.554 4.197 1.607 6.048L0 24l6.103-1.6c1.801.98 3.829 1.5 5.94 1.5h.005c6.64 0 12.039-5.399 12.042-12.041a11.813 11.813 0 00-3.535-8.402z" /></svg>
);

const styles: any = {
  app: { background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Arial, sans-serif' },
  nav: { background: '#1e293b', padding: '15px', borderBottom: '1px solid #eab308' },
  adminBox: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' },
  avatar: { width: '45px', height: '45px', background: '#eab308', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '20px', color: '#0f172a' },
  adminName: { fontWeight: 'bold', color: '#eab308' },
  waTag: { fontSize: '12px', color: '#22c55e' },
  navBtns: { display: 'flex', gap: '10px' },
  tab: { flex: 1, padding: '8px', background: '#334155', border: 'none', color: 'white', borderRadius: '5px' },
  activeTab: { flex: 1, padding: '8px', background: '#eab308', border: 'none', color: '#0f172a', borderRadius: '5px', fontWeight: 'bold' },
  addBtn: { padding: '8px 15px', background: '#facc15', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  container: { padding: '20px' },
  input: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' },
  area: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155', height: '80px' },
  mainBtn: { width: '100%', padding: '15px', background: '#eab308', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px' },
  liveCard: { margin: '15px', background: '#1e293b', borderRadius: '15px', padding: '20px', border: '1px solid #334155' },
  matchMeta: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginBottom: '10px' },
  bigScore: { textAlign: 'center', fontSize: '50px', fontWeight: 'bold' },
  tossLine: { textAlign: 'center', color: '#eab308', fontSize: '14px', margin: '10px 0' },
  targetBox: { textAlign: 'center', background: '#0f172a', padding: '10px', borderRadius: '8px', color: '#facc15', marginBottom: '15px' },
  statsTable: { border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'flex', background: '#334155', padding: '10px', fontSize: '12px', textAlign: 'center' },
  tableRow: { display: 'flex', padding: '12px 10px', borderBottom: '1px solid #334155', textAlign: 'center', fontSize: '14px', alignItems: 'center' },
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' },
  scoreBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' },
  exBtn: { padding: '15px', background: '#eab308', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 4', padding: '15px', background: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: 'white' },
  endBtn: { width: '100%', padding: '15px', background: '#334155', border: 'none', borderRadius: '8px', marginTop: '15px', color: '#94a3b8', fontWeight: 'bold' },
  historyItem: { background: '#1e293b', padding: '15px', borderRadius: '10px', marginBottom: '10px', borderLeft: '4px solid #eab308' }
};
